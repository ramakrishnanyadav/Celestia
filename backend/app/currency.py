"""
Currency & Money Module for CELESTIA.
Single canonical module for monetary minor unit (paise) conversions, safe integer arithmetic,
and authentic Indian numbering formatting (Lakhs / Crores / ₹ symbol).
Eliminates floating-point money inaccuracies.
"""

# 1 Rupee = 100 Paise
PAISE_PER_RUPEE = 100

def rupees_to_minor(rupees: int | float | str) -> int:
    """
    Converts rupees to integer minor units (paise).
    Handles string or numeric inputs safely without floating point drift.
    Example: 1500000 -> 150000000 paise (₹15 Lakhs).
    """
    if isinstance(rupees, str):
        # Strip currency symbols, commas, whitespace
        cleaned = rupees.replace("₹", "").replace(",", "").strip()
        if not cleaned:
            return 0
        if "." in cleaned:
            parts = cleaned.split(".", 1)
            whole = int(parts[0]) if parts[0] else 0
            fraction = parts[1][:2].ljust(2, "0")
            sign = -1 if whole < 0 or cleaned.startswith("-") else 1
            return sign * (abs(whole) * PAISE_PER_RUPEE + int(fraction))
        return int(cleaned) * PAISE_PER_RUPEE

    # Use exact integer rounding for numeric inputs
    return int(round(rupees * PAISE_PER_RUPEE))

def minor_to_rupees(minor: int) -> float:
    """Converts minor units (paise) to float rupees for display."""
    return round(minor / PAISE_PER_RUPEE, 2)

def format_inr_minor(minor: int, show_paise: bool = False) -> str:
    """
    Formats minor units (paise) into authentic Indian numbering format (lakhs/crores).
    Example:
        150000000 paise -> "₹15,00,000"
        250000 paise    -> "₹2,500"
        105075 paise    -> "₹1,050.75" (if show_paise is True)
    """
    if minor < 0:
        return f"-{format_inr_minor(abs(minor), show_paise)}"

    rupees = minor // PAISE_PER_RUPEE
    paise = minor % PAISE_PER_RUPEE

    s = str(rupees)
    if len(s) <= 3:
        formatted = s
    else:
        # Last 3 digits
        last_three = s[-3:]
        remaining = s[:-3]
        # In Indian numbering system, preceding digits are grouped in pairs of two
        groups = []
        while len(remaining) > 2:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        if remaining:
            groups.insert(0, remaining)
        formatted = ",".join(groups) + "," + last_three

    if show_paise or paise > 0:
        return f"₹{formatted}.{paise:02d}"
    return f"₹{formatted}"

def format_inr_compact(minor: int) -> str:
    """
    Compact Indian currency notation (e.g. ₹15 L, ₹1.5 Cr).
    """
    rupees = minor / PAISE_PER_RUPEE
    if abs(rupees) >= 10000000:
        cr = rupees / 10000000.0
        return f"₹{cr:.2f} Cr".rstrip("0").rstrip(".") if cr % 1 != 0 else f"₹{int(cr)} Cr"
    elif abs(rupees) >= 100000:
        lakhs = rupees / 100000.0
        return f"₹{lakhs:.2f} L".rstrip("0").rstrip(".") if lakhs % 1 != 0 else f"₹{int(lakhs)} L"
    elif abs(rupees) >= 1000:
        k = rupees / 1000.0
        return f"₹{k:.1f} K".rstrip("0").rstrip(".") if k % 1 != 0 else f"₹{int(k)} K"
    return format_inr_minor(minor)

def calculate_budget_allocation(
    total_budget_minor: int,
    contingency_percent: float = 0.10
) -> tuple[int, int]:
    """
    Calculates safety buffer and allocatable budget from total budget.
    Guarantees: contingency_minor + allocatable_minor == total_budget_minor
    """
    contingency_minor = int(round(total_budget_minor * contingency_percent))
    allocatable_minor = total_budget_minor - contingency_minor
    return contingency_minor, allocatable_minor

