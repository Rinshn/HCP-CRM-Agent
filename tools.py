import json
from langchain_core.tools import tool

# --- MANDATORY TOOL 1: LOG INTERACTION ---
@tool
def log_interaction(hcp_name: str, sentiment: str, notes: str, date: str, interaction_type: str):
    """
    Call this when the user wants to log a new interaction.
    Returns a JSON object that the frontend uses to populate the form.
    """
    # We return a special JSON string that the Frontend will detect
    return json.dumps({
        "ui_action": "FILL_FORM",
        "data": {
            "hcpName": hcp_name,
            "sentiment": sentiment,
            "topicsDiscussed": notes,
            "date": date,
            "interactionType": interaction_type
        }
    })

# --- MANDATORY TOOL 2: EDIT INTERACTION ---
@tool
def edit_interaction(field: str, value: str):
    """
    Call this when the user wants to correct a specific field in the form.
    field options: 'hcpName', 'sentiment', 'topicsDiscussed', 'date', 'interactionType'.
    """
    return json.dumps({
        "ui_action": "UPDATE_FIELD",
        "data": {
            "field": field,
            "value": value
        }
    })

# --- TOOL 3: HCP PROFILE ---
@tool
def get_hcp_profile(hcp_name: str):
    """Retrieves HCP details. Useful for filling context."""
    return f"Profile: {hcp_name} is a Cardiologist at St. Mary's. Key Interest: Heart Failure."

# --- TOOL 4: PRODUCT INFO ---
@tool
def get_product_info(product_name: str):
    """Retrieves product details."""
    return f"Product: {product_name} is a Beta Blocker. Phase 3 results: 95% efficacy."

# --- TOOL 5: SCHEDULE FOLLOW-UP ---
@tool
def schedule_follow_up(hcp_name: str, date: str, purpose: str):
    """Schedules a meeting."""
    return json.dumps({
        "ui_action": "SET_FOLLOWUP",
        "data": {
            "action": f"Meeting with {hcp_name} on {date} for {purpose}"
        }
    })
