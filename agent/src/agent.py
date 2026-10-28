import asyncio
import logging
import os
import textwrap
import time
from datetime import datetime
from typing import Annotated

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    RunContext,
    cli,
    function_tool,
    room_io,
)
from livekit.plugins import deepgram, groq, silero
from pydantic import Field

from db import close_db, describe_db_url, get_db

load_dotenv(".env.local")

print("DATABASE CONFIG:", describe_db_url())

logger = logging.getLogger("agent")
logging.basicConfig(level=logging.INFO)

MAX_CALL_SECONDS = int(os.getenv("MAX_CALL_DURATION_SECONDS", "180"))


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=textwrap.dedent(
                """\
                You are a friendly voice assistant that helps users check
                appointment availability and book slots.

                # Output rules (voice)
                - Speak in plain text only. No markdown, lists, emojis or code.
                - Keep replies short (1-3 sentences).
                - Ask only one question at a time.
                - Never invent availability. Always use the tools.

                # Behaviour
                - When the user asks about availability, call check_availability.
                - When they want to book, call book_slot with the exact date and time.
                - Confirm the booking clearly after a successful book_slot call.
                - If a tool fails, tell the user once and offer to try again.
                """
            ),
        )

    @function_tool()
    async def check_availability(
        self,
        context: RunContext,
        date: Annotated[
            str,
            Field(description="Date in YYYY-MM-DD format, e.g. 2026-10-29"),
        ],
    ) -> dict:
        """Check which time slots are still free on a given date."""
        logger.info("Tool: check_availability date=%s", date)

        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            return {
                "ok": False,
                "error": "invalid_date",
                "message": "Date must be in YYYY-MM-DD format.",
            }

        try:
            async with asyncio.timeout(4.0):
                db = await get_db()
                slots = await db.slot.find_many(
                    where={"date": date, "isBooked": False},
                    order={"time": "asc"},
                )
                available = [s.time for s in slots]
                return {
                    "ok": True,
                    "date": date,
                    "available_slots": available,
                    "count": len(available),
                }
        except TimeoutError:
            return {
                "ok": False,
                "error": "timeout",
                "message": "Availability service timed out. Please try again.",
            }
        except Exception:
            logger.exception("check_availability failed")
            return {
                "ok": False,
                "error": "internal",
                "message": "Something went wrong while checking availability.",
            }

    @function_tool()
    async def book_slot(
        self,
        context: RunContext,
        date: Annotated[
            str,
            Field(description="Date in YYYY-MM-DD format"),
        ],
        time: Annotated[
            str,
            Field(description="Time in HH:MM 24-hour format, e.g. 14:00"),
        ],
        name: Annotated[
            str,
            Field(description="Name of the person booking the appointment"),
        ] = "Guest",
    ) -> dict:
        """Book an available slot. Validates the slot still exists."""
        logger.info("Tool: book_slot date=%s time=%s name=%s", date, time, name)

        try:
            datetime.strptime(date, "%Y-%m-%d")
            datetime.strptime(time, "%H:%M")
        except ValueError:
            return {
                "ok": False,
                "error": "invalid_format",
                "message": "Date must be YYYY-MM-DD and time must be HH:MM.",
            }

        try:
            async with asyncio.timeout(4.0):
                db = await get_db()
                slot = await db.slot.find_first(
                    where={"date": date, "time": time, "isBooked": False}
                )
                if not slot:
                    return {
                        "ok": False,
                        "error": "slot_unavailable",
                        "message": f"The {time} slot on {date} is no longer available.",
                    }

                await db.slot.update(
                    where={"id": slot.id},
                    data={"isBooked": True, "bookedBy": name},
                )

                booking = await db.booking.create(
                    data={
                        "date": date,
                        "time": time,
                        "name": name,
                    }
                )

                return {
                    "ok": True,
                    "booking": {
                        "id": booking.id,
                        "date": booking.date,
                        "time": booking.time,
                        "name": booking.name,
                    },
                    "message": f"Successfully booked {time} on {date} for {name}.",
                }
        except TimeoutError:
            return {
                "ok": False,
                "error": "timeout",
                "message": "Booking service timed out. Please try again.",
            }
        except Exception:
            logger.exception("book_slot failed")
            return {
                "ok": False,
                "error": "internal",
                "message": "Something went wrong while booking the slot.",
            }


server = AgentServer()


@server.rtc_session(agent_name="voice-agent")
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}

    session = AgentSession(
        stt=deepgram.STT(
            model="nova-3",
            language="en",
            punctuate=True,
            interim_results=True,
        ),
        llm=groq.LLM(model="openai/gpt-oss-120b"),
        tts=deepgram.TTS(model="aura-2-thalia-en"),
        vad=silero.VAD.load(),
    )

    # Latency logging
    t_user_stopped: float | None = None

    @session.on("user_state_changed")
    def on_user_state(ev):
        nonlocal t_user_stopped
        if getattr(ev, "old_state", None) == "speaking":
            t_user_stopped = time.perf_counter()

    @session.on("agent_state_changed")
    def on_agent_state(ev):
        nonlocal t_user_stopped
        if getattr(ev, "new_state", None) == "speaking" and t_user_stopped is not None:
            ms = (time.perf_counter() - t_user_stopped) * 1000
            logger.info("LATENCY user-stopped -> agent-speaking: %.0f ms", ms)
            t_user_stopped = None

    # Hard call duration cap
    async def enforce_call_cap():
        await asyncio.sleep(MAX_CALL_SECONDS)
        logger.info("Call cap reached (%s s), closing session", MAX_CALL_SECONDS)
        try:
            await session.say(
                "We have reached the time limit for this demo. Thanks for talking. Goodbye."
            )
        except Exception:
            pass
        await session.aclose()

    cap_task = asyncio.create_task(enforce_call_cap())

    async def _on_shutdown():
        if not cap_task.done():
            cap_task.cancel()
            try:
                await cap_task
            except asyncio.CancelledError:
                pass
        await close_db()

    ctx.add_shutdown_callback(_on_shutdown)

    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(),
        ),
    )

    await ctx.connect()

    await session.generate_reply(
        instructions="Greet the user briefly and ask how you can help with scheduling."
    )


if __name__ == "__main__":
    cli.run_app(server)