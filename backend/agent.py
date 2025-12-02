from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.graph.message import add_messages
from typing import Annotated
from typing_extensions import TypedDict
from backend.tools import log_interaction, edit_interaction, get_hcp_profile, get_product_info, schedule_follow_up

load_dotenv()

class State(TypedDict):
    messages: Annotated[list, add_messages]

# Temperature 0 is critical for following the Pydantic schema strictly
llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0)
tools = [log_interaction, edit_interaction, get_hcp_profile, get_product_info, schedule_follow_up]
llm_with_tools = llm.bind_tools(tools)

def chatbot(state: State):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

def create_agent():
    graph_builder = StateGraph(State)
    graph_builder.add_node("chatbot", chatbot)
    graph_builder.add_node("tools", ToolNode(tools))
    
    graph_builder.add_edge(START, "chatbot")
    graph_builder.add_conditional_edges("chatbot", tools_condition)
    graph_builder.add_edge("tools", END)
    
    return graph_builder.compile()
