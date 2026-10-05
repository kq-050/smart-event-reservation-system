from apscheduler.schedulers.background import BackgroundScheduler

from .database import SessionLocal, utc_now
from . import models


def expire_reservations():
    db = SessionLocal()

    try:
        expired_reservations = db.query(
            models.Reservation
        ).filter(
            models.Reservation.status == "active",
            models.Reservation.expires_at <= utc_now()
        ).all()

        for reservation in expired_reservations:
            reservation.status = "expired"

        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


scheduler = BackgroundScheduler()

scheduler.add_job(
    expire_reservations,
    "interval",
    minutes=1
)