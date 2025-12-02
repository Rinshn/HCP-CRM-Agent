from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from tools import log_interaction, edit_interaction, get_hcp_profile, get_product_info, schedule_follow_up

load_dotenv()

# We use Llama 3.3 (Versatile) as it is the most capable model on Groq's free tier
# Temperature 0 ensures it doesn't "get creative" and hallucinate extra steps
llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0)

tools = [log_interaction, edit_interaction, get_hcp_profile, get_product_info, schedule_follow_up]

def create_agent():
    # We create the agent without a system prompt argument here to avoid the TypeError.
    # The system prompt will be injected at runtime in main.py
    return create_react_agent(llm, tools)
