import os
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import SystemMessage
from backend.agent import create_agent

load_dotenv()

app = FastAPI(title="HCP CRM Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NOTE: This assumes backend/agent.py exists and is correct.
agent_runnable = create_agent()

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    sys_msg = SystemMessage(content=f"""
    SYSTEM CONTEXT:
    - Current Server Time: {now_str}
    - Role: CRM Data Entry Assistant.
    - API MODE: RETURN JSON ONLY.
    
    CRITICAL INSTRUCTION FOR TIME:
    - If the user implies "now" or "today", PASS EMPTY STRINGS "" for date/time arguments. The tool will auto-fill the exact server timestamp.
    - Only fill date/time if the user explicitly sets a PAST or FUTURE time (e.g. "yesterday at 2pm").
    """)

    config = {"recursion_limit": 25} 
    
    try:
        final_state = agent_runnable.invoke({
            "messages": [sys_msg, ("human", request.message)]
        }, config=config)
        
        return {"response": final_state["messages"][-1].content}
    except Exception as e:
        return {"response": f"Error: {str(e)}"}

@app.get("/")
def read_root():
    return {"status": "ok"}