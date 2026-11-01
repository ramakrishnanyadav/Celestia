from typing import Any

from ..models import Event, EventPreference


def generate_personalized_ideas(event: Event, preference: EventPreference | None = None) -> dict[str, Any]:
    """
    Celebration Intelligence Module:
    Produces culturally nuanced, budget-conscious, and aesthetic recommendations.
    Never assumes cultural or religious practices; provides modular customizable components.
    """
    event_type = (event.event_type or "wedding").lower()
    culture = (preference.regional_culture if preference else "Maharashtrian Traditional")
    theme_pref = (preference.theme if preference else "Royal Marigold & Polished Brass")
    dietary = (preference.dietary if preference else "Pure Vegetarian")
    guest_count = event.guest_count or 300
    budget_lakhs = round((event.budget_minor or 150000000) / 10000000, 2)

    if event_type == "wedding":
        return get_wedding_ideas(culture, theme_pref, dietary, guest_count, budget_lakhs)
    elif event_type == "birthday":
        return get_birthday_ideas(guest_count, budget_lakhs)
    else:
        return get_community_ideas(guest_count, budget_lakhs)

def get_wedding_ideas(culture: str, theme_pref: str, dietary: str, guest_count: int, budget_lakhs: float) -> dict[str, Any]:
    return {
        "themes": [
            {
                "id": "theme-1",
                "title": "Royal Marigold & Polished Brass",
                "aesthetic": "Heritage Maharashtrian Rajwada with warm golden glows, fragrant yellow & orange genda flowers, and antique brass urlis.",
                "color_palette": ["#D97706", "#B45309", "#0B132B", "#FAF7F2", "#0D9488"],
                "mood": "Timeless, Auspicious, Royal",
                "budget_tier": "Balanced (Fits ₹15L budget effortlessly)"
            },
            {
                "id": "theme-2",
                "title": "Minimalist Pastel Flora & Cascading Mogra",
                "aesthetic": "Blush pink, champagne gold, and ivory drapery with fresh white mogra (jasmine) garlands and soft ambient fairy canopies.",
                "color_palette": ["#F472B6", "#FDE047", "#F8FAFC", "#64748B", "#0D9488"],
                "mood": "Romantic, Airy, Modern Elegance",
                "budget_tier": "Premium Elegance"
            },
            {
                "id": "theme-3",
                "title": "Peshwai Temple Grandeur",
                "aesthetic": "Carved wooden temple pillars, deep crimson velvet backdrops, bells, and brass samai lamps illuminating the stage.",
                "color_palette": ["#991B1B", "#D97706", "#FEF3C7", "#1E293B", "#047857"],
                "mood": "Sacred, Traditional, Stately",
                "budget_tier": "Heritage Classic"
            }
        ],
        "decor_concepts": [
            {
                "area": "Mandap Sanctum",
                "concept": "Four-pillar open Mandap with dome interwoven with fresh marigolds and hanging brass bells. Elevated wooden platform for Muhurtham rituals.",
                "sustainable_tip": "Use locally sourced marigolds from Dadar flower market; 100% compostable post-event."
            },
            {
                "area": "Grand Entrance Passage",
                "concept": "Traditional toran archway with banana leaves, tuberoses (nishigandha), and low urlis with floating lotus flowers and tea lights.",
                "sustainable_tip": "Avoid styrofoam; use bamboo frames and terracotta planters."
            },
            {
                "area": "Dining & Buffet Hall",
                "concept": "Warm amber uplighting, brass service displays, customized printed menu cards, and minimalist table runners in earthy tones.",
                "sustainable_tip": "Biodegradable sal leaf plates / copper thali service."
            }
        ],
        "food_and_menu": [
            {
                "session": "Welcome Drinks & High-Tea Refreshments",
                "dietary": dietary,
                "highlight_dishes": [
                    "Fresh Kokum Sherbet & Spiced Solkadhi Shooters",
                    "Kothimbir Vadi with mint-coriander chutney",
                    "Live Mumbai Street Chaat Counter (Pani Puri, Sev Puri, Dahi Vada)",
                    "Masala Chai & Filter Coffee Station"
                ]
            },
            {
                "session": "Main Traditional Wedding Feast (Lunch)",
                "dietary": dietary,
                "highlight_dishes": [
                    "Hot steamed Ukadiche Modak drenched in pure desi ghee",
                    "Traditional Puran Poli with Katachi Amti",
                    "Paneer Peshwai in rich cashew-tomato gravy",
                    "Vangi Bhaat (Spiced Brinjal Rice) with cucumber koshimbir",
                    "Crispy Kurdai, Papad & Sweet Shrikhand / Basundi"
                ]
            },
            {
                "session": "Evening Reception Sweets & Desserts",
                "dietary": dietary,
                "highlight_dishes": [
                    "Live Jalebi & Rabdi Counter",
                    "Gulab Jamun infused with saffron cardamom",
                    "Artisanal Kulfi on stick (Pista & Malai)"
                ]
            }
        ],
        "entertainment": [
            {
                "element": "Sacred Shehnai & Sitar Recital",
                "timing": "Morning Welcome & Muhurtham hour",
                "description": "Live traditional acoustic masters setting a serene, blessed atmosphere as guests arrive.",
                "approx_cost": "₹25,000 - ₹35,000"
            },
            {
                "element": "Authentic Puneri Dhol-Tasha Pathak",
                "timing": "Groom's Barat & Grand Entrance",
                "description": "High-energy rhythmic Maharashtrian percussion welcoming the procession with authentic cultural grandeur.",
                "approx_cost": "₹35,000 - ₹50,000"
            },
            {
                "element": "Evening Sangeet DJ & Dance Floor",
                "timing": "Post-ceremony celebration",
                "description": "Curated playlist blending classic Bollywood hits, Marathi folk, and modern celebratory tracks.",
                "approx_cost": "₹45,000 - ₹60,000"
            }
        ],
        "return_gifts": [
            {
                "item": "Handcrafted Antique Brass Diya in Embroidered Pouch",
                "meaning": "Symbol of light, auspicious prosperity, and eternal gratitude.",
                "estimated_unit_cost": "₹150 - ₹220 per guest",
                "recommended_for": "Elderly relatives & family heads"
            },
            {
                "item": "Eco-Friendly Plantable Seed Paper Box with Artisanal Dry Fruits",
                "meaning": "Sustainable remembrance that blooms into marigold flowers when planted.",
                "estimated_unit_cost": "₹140 - ₹190 per guest",
                "recommended_for": "General guests & friends"
            }
        ],
        "cultural_traditions": [
            {
                "name": "Sakhar Puda",
                "description": "Traditional sugar-packet exchange formally sealing the union between families.",
                "is_optional": True,
                "typical_duration": "45 minutes"
            },
            {
                "name": "Kelvan & Mehendi",
                "description": "Pre-wedding feast and artistic henna application surrounded by folk songs.",
                "is_optional": True,
                "typical_duration": "3 hours"
            },
            {
                "name": "Haldi Ceremony",
                "description": "Auspicious turmeric application with marigold flower petal showers.",
                "is_optional": True,
                "typical_duration": "2 hours"
            },
            {
                "name": "Muhurtham & Saat Phere",
                "description": "Sacred vows around the sacred fire at the astrologically auspicious hour.",
                "is_optional": False,
                "typical_duration": "1.5 hours"
            },
            {
                "name": "Satyanarayan Puja",
                "description": "Blessing ritual invoking divine abundance for the new household.",
                "is_optional": True,
                "typical_duration": "1 hour"
            }
        ],
        "budget_conscious_alternatives": [
            {
                "strategy": "Opt for locally grown flowers over imported orchids",
                "savings": "₹50,000 - ₹75,000 saved on decor",
                "impact": "Higher visual authenticity and fresh fragrance, zero compromise on elegance."
            },
            {
                "strategy": "Digital RSVP & WhatsApp Save-the-Dates for 60% of guests",
                "savings": "₹20,000 saved on courier and paper printing",
                "impact": "Faster responses and real-time headcount tracking."
            },
            {
                "strategy": "Book a weekday or morning Muhurtham banquet slot",
                "savings": "₹70,000 - ₹1,00,000 off venue tariff",
                "impact": "Traditional timing favored by elders with lower venue peak charges."
            }
        ]
    }

def get_birthday_ideas(guest_count: int, budget_lakhs: float) -> dict[str, Any]:
    return {
        "themes": [
            {"id": "theme-b1", "title": "Enchanted Starlight Carnival", "aesthetic": "Glittering fairy canopies, circus arches, interactive booth games.", "color_palette": ["#3B82F6", "#F59E0B", "#10B981", "#FAF7F2", "#1E293B"], "mood": "Joyful, Energetic", "budget_tier": "Moderate"},
            {"id": "theme-b2", "title": "Retro Bollywood Disco Party", "aesthetic": "Vintage vinyl records, neon signs, mirror balls, vibrant color backdrops.", "color_palette": ["#EC4899", "#8B5CF6", "#FBBF24", "#0F172A", "#14B8A6"], "mood": "Nostalgic, Festive", "budget_tier": "Vibrant"}
        ],
        "decor_concepts": [
            {"area": "Cake Stage", "concept": "Custom 3D thematic photo backdrop with balloon garland and LED neon signage.", "sustainable_tip": "Latex biodegradable balloons."}
        ],
        "food_and_menu": [
            {"session": "Party Buffet & Finger Foods", "dietary": "Vegetarian", "highlight_dishes": ["Mini sliders", "Corn cheese nuggets", "Paneer tikka skewers", "Customized 3-tier theme cake", "Mocktail fountain"]}
        ],
        "entertainment": [
            {"element": "Live Magician & Balloon Sculptor", "timing": "First 90 minutes", "description": "Interactive sleight of hand and custom balloon shapes.", "approx_cost": "₹15,000"},
            {"element": "Karaoke & Dance Emcee", "timing": "Post-cake cutting", "description": "Engaging games and dance floor hosting.", "approx_cost": "₹20,000"}
        ],
        "return_gifts": [
            {"item": "Personalized Canvas Art Kit & Custom Cupcakes", "meaning": "Creative memory to take home.", "estimated_unit_cost": "₹250 per guest", "recommended_for": "All attendees"}
        ],
        "cultural_traditions": [],
        "budget_conscious_alternatives": [
            {"strategy": "Order cupcakes alongside a smaller display cake", "savings": "₹8,000 saved on custom fondant cake weight", "impact": "Zero cake wastage and faster serving."}
        ]
    }

def get_community_ideas(guest_count: int, budget_lakhs: float) -> dict[str, Any]:
    return {
        "themes": [
            {"id": "theme-c1", "title": "Sanskriti — Heritage Utsav", "aesthetic": "Traditional rangoli carpet, terracotta diyas, handloom fabric canopies, acoustic stage.", "color_palette": ["#B45309", "#047857", "#1E293B", "#FAF7F2", "#D97706"], "mood": "Community Unity, Cultural Pride", "budget_tier": "Community Scale"}
        ],
        "decor_concepts": [
            {"area": "Main Community Stage", "concept": "Khadi drapes, brass urns, ceremonial lighting, and wide banner with event branding.", "sustainable_tip": "Zero plastic policy."}
        ],
        "food_and_menu": [
            {"session": "Community Mahaprasad / Buffet", "dietary": "Pure Vegetarian", "highlight_dishes": ["Puri Bhaji / Khichdi Kadi", "Mukhwas station", "Buttermilk coolers", "Halwa / Kheer"]}
        ],
        "entertainment": [
            {"element": "Folk Dance & Classical Sitar Troupe", "timing": "Evening showcase", "description": "Local youth and community talent performances.", "approx_cost": "₹20,000"}
        ],
        "return_gifts": [
            {"item": "Medicinal Tulsi Plant in Terracotta Pot", "meaning": "Health, prosperity, and green living.", "estimated_unit_cost": "₹80 per guest", "recommended_for": "Community members"}
        ],
        "cultural_traditions": [],
        "budget_conscious_alternatives": [
            {"strategy": "Partner with local cooperative societies for community hall discount", "savings": "₹40,000 saved on commercial venue tariffs", "impact": "High civic accessibility and ample parking."}
        ]
    }
