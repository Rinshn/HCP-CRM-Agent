import os
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

agent_runnable = create_agent()

class ChatRequest(BaseModel):
    message: str

# SYSTEM PROMPT
SYS_MSG = SystemMessage(content="""
You are a backend API.
If user asks to log/record, YOU MUST CALL log_interaction tool.
RETURN ONLY THE JSON from the tool.
DO NOT write any other text.
""")

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    # INCREASED LIMIT TO 15 TO PREVENT "NEED MORE STEPS" ERROR
    config = {"recursion_limit": 30}
    
    try:
        final_state = agent_runnable.invoke({
            "messages": [SYS_MSG, ("human", request.message)]
        }, config=config)
        return {"response": final_state["messages"][-1].content}
    except Exception as e:
        return {"response": f"Error: {str(e)}"}

@app.get("/")
def read_root():
    return {"status": "ok"}
