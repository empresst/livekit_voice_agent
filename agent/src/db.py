"""Shared Prisma client for the agent.

Connect once and reuse. Spawning a new Prisma query engine on every tool
call is slow (it adds latency to a voice turn) and churns connections
through the pooler.

Usage in a tool:
    from db import get_db
    db = await get_db()
    slots = await db.slot.find_many(...)
    # no connect() / disconnect() here
"""

import asyncio
import logging
import os
import re

from prisma import Prisma

logger = logging.getLogger("agent.db")

_db: Prisma | None = None
_lock = asyncio.Lock()


def describe_db_url() -> str:
    """DATABASE_URL with the password hidden, for debugging.

    Check the host, the port, and whether any query string (for example
    ?pgbouncer=true) is actually present in the process that runs the agent.
    """
    url = os.environ.get("DATABASE_URL", "<DATABASE_URL not set>")
    return re.sub(r"(://[^:/@]+):[^@]*@", r"\1:***@", url)


async def get_db() -> Prisma:
    """Return a connected Prisma client, creating or reconnecting if needed."""
    global _db
    if _db is not None and _db.is_connected():
        return _db
    async with _lock:
        if _db is None or not _db.is_connected():
            logger.info("Connecting to database: %s", describe_db_url())
            client = Prisma()
            await client.connect()
            _db = client
    return _db


async def close_db() -> None:
    """Disconnect on shutdown (for example from ctx.add_shutdown_callback)."""
    global _db
    if _db is not None and _db.is_connected():
        await _db.disconnect()
    _db = None