import time
from pyinstrument import Profiler
from app.database import SessionLocal
from app.models import User, Event, EventPreference
from app.engines.ai_service import AIService
from app.auth import hash_password

def run_profile():
    db = SessionLocal()
    # Create test user and event
    user = User(email=f"profile_{int(time.time()*1000)}@celestia.ai", name="Profiler", password_hash=hash_password("testpass123"))
    db.add(user)
    db.commit()
    db.refresh(user)
    
    event = Event(
        user_id=user.id,
        title="Royal Wedding Profiling",
        event_type="wedding",
        city="Mumbai",
        venue_type="Banquet Hall",
        guest_count=300,
        budget_minor=300000000,
        currency="INR",
        timezone="Asia/Kolkata",
        preparation_months=6
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    pref = EventPreference(
        event_id=event.id,
        dietary="Pure Vegetarian",
        theme="Royal Marigold",
        regional_culture="Maharashtrian Traditional"
    )
    db.add(pref)
    db.commit()
    db.refresh(event)

    profiler = Profiler()
    profiler.start()
    
    start_time = time.perf_counter()
    AIService.generate_full_event_plan(db, event)
    elapsed = time.perf_counter() - start_time
    
    profiler.stop()
    
    print(f"=== GENERATE PLAN ELAPSED TIME: {elapsed*1000:.2f} ms ===")
    print(profiler.output_text(unicode=False, color=False, show_all=True))
    db.close()

if __name__ == "__main__":
    run_profile()
