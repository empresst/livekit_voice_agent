import asyncio
from datetime import date, timedelta
from prisma import Prisma
from datetime import datetime, timezone, timedelta

TZ = timezone(timedelta(hours=6))
today = datetime.now(TZ).date()

TIMES = ["09:00", "10:30", "13:00", "14:30", "16:00"]
DAYS_AHEAD = 30

async def main():
    db = Prisma()
    await db.connect()
    today = date.today()

    await db.slot.delete_many(where={"date": {"lt": today.isoformat()}})
    await db.booking.delete_many()
    await db.slot.update_many(
        where={"isBooked": True},
        data={"isBooked": False, "bookedBy": None, "bookingId": None},
    )

    created = 0
    for i in range(DAYS_AHEAD):
        d = (today + timedelta(days=i)).isoformat()
        for t in TIMES:
            if not await db.slot.find_first(where={"date": d, "time": t}):
                await db.slot.create(data={"date": d, "time": t})
                created += 1

    print(f"Created {created} slots through {(today + timedelta(days=DAYS_AHEAD - 1)).isoformat()}")
    await db.disconnect()

asyncio.run(main())