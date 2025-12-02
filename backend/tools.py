import json
from langchain_core.tools import tool

# explicit markers so the agent backend can detect terminal tool outputs
TOOL_START = "<<<TOOL_OUTPUT>>>"
TOOL_END = "<<<END_TOOL>>>"

@tool
def log_interaction(hcp_name: str, sentiment: str = "neutral", notes: str = "", date: str = "", interaction_type: str = "meeting"):
    """Log an HCP interaction. Returns a marked JSON string for the backend to parse.
    Expected to be called by the agent once per user intent.
    """
    payload = {
        "ui_action": "FILL_FORM",
        "data": {
            "hcpName": hcp_name,
            "sentiment": sentiment,
            "topicsDiscussed": notes,
            "date": date,
            "interactionType": interaction_type
        }
    }
    return TOOL_START + json.dumps(payload) + TOOL_END

@tool
def edit_interaction(field: str, value: str):
    """Edit a single field. Returns a marked JSON string describing the update."""
    payload = {
        "ui_action": "UPDATE_FIELD",
        "data": {"field": field, "value": value}
    }
    return TOOL_START + json.dumps(payload) + TOOL_END

@tool
def get_hcp_profile(hcp_name: str):
    """Dummy HCP profile lookup - replace with DB logic later."""
    payload = {"ui_action": "HCP_PROFILE", "data": {"hcpName": hcp_name, "specialty": "Cardiology"}}
    return TOOL_START + json.dumps(payload) + TOOL_END

@tool
def schedule_follow_up(hcp_name: str, days: int = 7):
    """Schedule a follow-up - returns a marked response."""
    payload = {"ui_action": "SCHEDULE_FOLLOWUP", "data": {"hcpName": hcp_name, "days": days}}
    return TOOL_START + json.dumps(payload) + TOOL_END
