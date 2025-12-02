import json
import sqlite3
from datetime import datetime
from langchain_core.tools import tool
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

# --- SCHEMAS ---

class LogInteractionSchema(BaseModel):
    hcp_name: str = Field(description="Name of the Health Care Professional")
    interaction_type: Literal["Meeting", "Call", "Email"] = Field(description="Type of interaction", default="Meeting")
    sentiment: Literal["Positive", "Neutral", "Negative"] = Field(description="Observed sentiment", default="Neutral")
    date: str = Field(description="Date (YYYY-MM-DD). Leave empty string if 'today' or 'now'.", default="")
    time: str = Field(description="Time (HH:MM). Leave empty string if 'now'.", default="")
    topics_discussed: str = Field(description="Summary of topics discussed", default="")
    
    attendees: Optional[List[str]] = Field(description="List of other people present", default=None)
    materials_shared: Optional[List[str]] = Field(description="List of materials shared", default=None)
    samples_distributed: Optional[List[str]] = Field(description="List of samples given", default=None)
    outcomes: str = Field(description="Key conclusions", default="")
    follow_up_actions: str = Field(description="Next steps", default="")

class EditInteractionSchema(BaseModel):
    field: Literal["hcpName", "interactionType", "date", "time", "sentiment", "outcomes", "followUpActions", "topicsDiscussed"] = Field(description="Field to edit")
    value: str = Field(description="New value")

# --- DATABASE HELPER ---
def log_to_db(hcp, date, time, type, sentiment, notes, attendees, materials, samples, outcomes, followup):
    try:
        conn = sqlite3.connect('crm_v2.db')
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS interactions 
                     (id INTEGER PRIMARY KEY, 
                      hcp TEXT, date TEXT, time TEXT, type TEXT, sentiment TEXT, notes TEXT,
                      attendees TEXT, materials TEXT, samples TEXT, outcomes TEXT, followup TEXT,
                      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
        
        # Convert lists to strings for storage
        att_str = ", ".join(attendees) if attendees else ""
        mat_str = ", ".join(materials) if materials else ""
        sam_str = ", ".join(samples) if samples else ""
        
        c.execute("""INSERT INTO interactions 
                     (hcp, date, time, type, sentiment, notes, attendees, materials, samples, outcomes, followup) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                  (hcp, date, time, type, sentiment, notes, att_str, mat_str, sam_str, outcomes, followup))
        conn.commit()
        conn.close()
        print(f"✅ DATABASE: Logged {hcp} at {time} on {date}")
    except Exception as e:
        print(f"❌ DATABASE ERROR: {e}")

# --- TOOLS ---

@tool(args_schema=LogInteractionSchema)
def log_interaction(
    hcp_name: str, 
    interaction_type: str = "Meeting", 
    sentiment: str = "Neutral", 
    date: str = "", 
    time: str = "", 
    topics_discussed: str = "",
    attendees: Optional[List[str]] = None, 
    materials_shared: Optional[List[str]] = None, 
    samples_distributed: Optional[List[str]] = None, 
    outcomes: str = "", 
    follow_up_actions: str = ""
):
    """Log a new interaction. Leave date/time empty to use current server time."""
    
    # 1. LIVE TIME ENFORCEMENT - Aggressively overwrite LLM hallucinations
    now = datetime.now()
    
    # Force live date if input is generic, empty, or a common hallucination
    if not date or date.lower().strip() in ["", "today", "now"]:
        real_date = now.strftime("%Y-%m-%d")
    else:
        real_date = date

    # Force live time if input is generic, empty, or a common hallucination
    if not time or not any(c.isdigit() for c in time) or time.lower().strip() in ["", "now", "current", "--:--", "09:00", "10:00", "12:00"]:
        real_time = now.strftime("%H:%M")
    else:
        real_time = time
    
    # 2. List Handling
    safe_attendees = attendees if attendees is not None else []
    safe_materials = materials_shared if materials_shared is not None else []
    safe_samples = samples_distributed if samples_distributed is not None else []
    safe_notes = topics_discussed if topics_discussed else " "

    # 3. LOG EVERYTHING TO DB
    log_to_db(
        hcp_name, real_date, real_time, interaction_type, sentiment, safe_notes,
        safe_attendees, safe_materials, safe_samples, outcomes, follow_up_actions
    )

    # 4. Return data + CUSTOM MESSAGE
    return json.dumps({
        "ui_action": "FILL_FORM",
        "message": f"I have logged your meeting with {hcp_name}.",
        "data": {
            "hcpName": hcp_name,
            "interactionType": interaction_type,
            "sentiment": sentiment,
            "date": real_date, # Guaranteed Live Date
            "time": real_time, # Guaranteed Live Time
            "topicsDiscussed": safe_notes,
            "attendees": safe_attendees,
            "materialsShared": safe_materials,
            "samplesDistributed": safe_samples,
            "outcomes": outcomes,
            "followUpActions": follow_up_actions
        }
    })

@tool(args_schema=EditInteractionSchema)
def edit_interaction(field: str, value: str):
    """Edit a specific field."""
    if field == "sentiment":
        value = value.capitalize()
    return json.dumps({
        "ui_action": "UPDATE_FIELD",
        "message": "I have updated the specified field.",
        "data": {"field": field, "value": value}
    })

@tool
def get_hcp_profile(hcp_name: str):
    """Dummy tool for HCP profile."""
    return f"Profile: {hcp_name} - Cardiologist."

@tool
def get_product_info(product_name: str):
    """Dummy tool for product info."""
    return f"Product: {product_name} - Beta Blocker."

@tool
def schedule_follow_up(hcp_name: str, date: str, purpose: str):
    """Dummy tool for scheduling."""
    return json.dumps({"ui_action": "SET_FOLLOWUP"})