import httpx

BASE_URL = "http://127.0.0.1:8000/api"

def test_scenarios():
    print("=== CELESTIA SCENARIO & PERSONALIZATION AUDIT ===")
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)
    
    # 1. Natural Language Extraction Differentiation
    prompts = [
        ("Mumbai Maharashtrian Wedding", "Organize a traditional Maharashtrian wedding in Mumbai for 300 guests with maximum budget of ₹15,00,000, 100% vegetarian catering, 6-month preparation"),
        ("Ahmedabad Gujarati Wedding", "Organize a traditional Gujarati wedding in Ahmedabad for 400 guests with budget ₹25,00,000, pure veg catering, 6 months prep"),
        ("Birthday Party", "Plan a 1st birthday party in Pune for 60 guests with budget ₹2,50,000 with balloon carnival theme"),
        ("Community Gathering", "Organize a Diwali community utsav in Mumbai for 600 attendees with budget ₹5,00,000 and vegetarian feast")
    ]
    
    for label, text in prompts:
        res = client.post("/ai/extract-requirements", json={"natural_language_prompt": text})
        data = res.json()
        print(f"\n[*] Extracted for '{label}':")
        print(f"    Event Type: {data.get('event_type')}")
        print(f"    City: {data.get('city')}")
        print(f"    Guests: {data.get('guest_count')}")
        print(f"    Budget: INR {data.get('budget_rupees'):,.2f}")
        print(f"    Dietary: {data.get('dietary')}")
        print(f"    Regional/Culture: {data.get('regional_culture')}")
        print(f"    Traditions: {data.get('cultural_traditions')}")

if __name__ == "__main__":
    test_scenarios()
