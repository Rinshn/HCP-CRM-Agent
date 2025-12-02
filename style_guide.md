# LangGraph and Agent Implementation Style Guide

This document outlines the common patterns, imports, and agent structures observed in the project.

## LangGraph Implementation

### Core Concepts

- **Agents:** The primary building blocks are ReAct agents created using `langgraph.prebuilt.create_react_agent`.
- **State:** Graph state is managed through a class that inherits from `langgraph.graph.MessagesState`. This class can be extended with additional fields to hold custom state.
- **Graphs:** The `langgraph.graph.StateGraph` is used to define the structure of the agent. Nodes are added with `add_node`, and control flow is managed with `add_edge` and `add_conditional_edges`.
- **Tools:** Tools are defined as Python functions and decorated with `@tool` from `langchain_core.tools`. They have clear docstrings explaining their purpose, arguments, and return values.

### Common Imports

- **LangGraph:**
  - `from langgraph.graph import StateGraph, END, START`
  - `from langgraph.prebuilt import create_react_agent, ToolNode, tools_condition`
  - `from langgraph.checkpoint.memory import InMemorySaver`
  - `from langgraph.types import Send, interrupt`
- **LangChain:**
  - `from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage`
  - `from langchain_core.tools import tool, BaseTool, Tool`
  - `from langchain_openai import ChatOpenAI`
- **Pydantic:**
  - `from pydantic import BaseModel, Field` (for structured output)

### Agent and Graph Construction

1.  **Define Tools:** Create tools using the `@tool` decorator. Each tool should have a descriptive name and a docstring that clearly explains its function, parameters, and what it returns.

    ```python
    @tool
    def my_tool(param1: str) -> str:
        """
        Description of what the tool does.

        Parameters:
            param1 (str): Description of the parameter.

        Returns:
            str: Description of the return value.
        """
        return "result"
    ```

2.  **Define State:** Create a state class that inherits from `MessagesState`.

    ```python
    from langgraph.graph import MessagesState

    class MyAgentState(MessagesState):
        # Add any custom state fields here
        pass
    ```

3.  **Create Agent:** Use `create_react_agent` to create the agent.

    ```python
    from langgraph.prebuilt import create_react_agent
    from langchain_openai import ChatOpenAI

    agent = create_react_agent(
        model=ChatOpenAI(model="gpt-4o-mini"),
        tools=[my_tool],
        prompt="You are a helpful assistant."
    )
    ```

4.  **Create Graph:** Instantiate `StateGraph` and define the nodes and edges.

    ```python
    from langgraph.graph import StateGraph, START, END
    from langgraph.prebuilt import ToolNode, tools_condition

    builder = StateGraph(MyAgentState)
    builder.add_node("agent", agent)
    builder.add_node("tools", ToolNode([my_tool]))
    builder.add_edge(START, "agent")
    builder.add_conditional_edges(
        "agent",
        tools_condition,
    )
    builder.add_edge("tools", "agent")
    graph = builder.compile()
    ```

### Human-in-the-Loop (HITL)

- **Static Interruption:** Use `interrupt_before=["tools"]` in `create_react_agent` to always pause before executing tools.
- **Dynamic Interruption:**
    - Use a `post_model_hook` to check the agent's proposed tool calls and `interrupt()` the graph if a condition is met (e.g., a risky tool is about to be used).
    - Create a tool that explicitly calls `interrupt()` to ask the user a question.
    - Use a standardized format for interruptions, like `langgraph.prebuilt.interrupt.HumanInterrupt`, to provide a consistent experience.

### Supervisor Agents

- Supervisors are used to coordinate multiple specialized agents.
- `langgraph_supervisor.create_supervisor` is the high-level API for creating a supervisor.
- A supervisor is itself an agent that has tools to delegate tasks to other agents.

## Agent Structure

- **System Message:** Each agent has a clear system message that defines its role, responsibilities, and constraints.
- **Specialization:** The project follows a multi-agent approach where each agent is specialized for a specific task (e.g., research, trading). This is preferred over a single agent with many tools.
- **Tool Definitions:** Tools are well-documented with Pydantic models for their arguments, which allows the LLM to understand how to use them effectively.

## FastAPI Implementation

No FastAPI code was found in the analyzed files. The focus of the project is on LangGraph agent implementation.
