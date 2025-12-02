# GEMINI.md

This file provides a comprehensive overview of the HCP_CRM_Project, which is a full-stack web application with a learning component. It is intended to be used as a context for future interactions with the Gemini CLI.

## Project Overview

This project is a multi-faceted repository that includes:

1.  **A Full-Stack Web Application:** A CRM (Customer Relationship Management) tool for Healthcare Professionals (HCPs).
    *   **Frontend:** A React application for the user interface.
    *   **Backend:** A Python-based backend using FastAPI that exposes an API for the frontend.
2.  **An AI Agent:** The backend is powered by a LangGraph AI agent that uses the Groq API with the `gemma2-9b-it` model. This agent is designed to handle CRM-related tasks.
3.  **A Learning Resource:** A collection of Jupyter notebooks (`*.ipynb` files) that serve as a course on advanced LangGraph concepts.

The primary goal of the application is to provide a user-friendly interface for logging and managing interactions with HCPs, with the AI agent assisting in these tasks.

## File Structure

The project is organized into the following key directories and files:

*   `frontend/`: Contains the React frontend application.
*   `backend/`: Contains the FastAPI backend application and the LangGraph agent.
*   `tools.py`: Defines the tools that the LangGraph agent can use.
*   `*.ipynb`: A series of Jupyter notebooks for learning about LangGraph.
*   `README.md`: The main README file for the project, focusing on the LangGraph learning aspect.
*   `style_guide.md`: A style guide for LangGraph and agent implementation.

## Building and Running

### Backend

The backend is a FastAPI application. To run it, you will need to have Python and pip installed.

**1. Create and Activate a Virtual Environment:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**2. Install Dependencies:**
The project is missing a `requirements.txt` file. Based on the code, you will need to install the following packages:

```bash
pip install fastapi uvicorn python-dotenv langchain-groq langgraph pydantic
```
**TODO:** Create a `requirements.txt` file in the `backend` directory to make dependency management easier.

**3. Run the Backend Server:**
From the root directory, run:
```bash
uvicorn backend.main:app --reload
```
The backend will be available at `http://127.0.0.1:8000`.

### Frontend

The frontend is a React application. To run it, you will need to have Node.js and npm installed.

**1. Navigate to the Frontend Directory:**
```bash
cd frontend
```

**2. Install Dependencies:**
```bash
npm install
```

**3. Run the Frontend Development Server:**
```bash
npm start
```
The frontend will be available at `http://localhost:3000`.

## Development Conventions

The `style_guide.md` file outlines the following conventions for LangGraph and agent implementation:

*   **Agents:** Use `langgraph.prebuilt.create_react_agent` to create ReAct agents.
*   **State:** Manage graph state with classes that inherit from `langgraph.graph.MessagesState`.
*   **Graphs:** Use `langgraph.graph.StateGraph` to define the agent's structure.
*   **Tools:** Define tools as Python functions with the `@tool` decorator and provide clear docstrings.
*   **Human-in-the-Loop (HITL):** Use both static (`interrupt_before=["tools"]`) and dynamic (e.g., `post_model_hook`, `ask_question` tool) interruption patterns.
*   **Supervisor Agents:** Use supervisors to coordinate multiple specialized agents.
*   **Agent Structure:** Provide clear system messages for each agent and favor specialization over a single monolithic agent.
*   **Tool Definitions:** Use Pydantic models to define the arguments for tools.
