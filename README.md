# AI-First HCP Engagement CRM

## 📋 Project Overview
This project is a technical submission for **Task 1: AI-First CRM HCP Module**. It implements a "Log Interaction Screen" where the user interface is controlled entirely by an **AI Agent** (LangGraph + Groq), prohibiting manual form entry.

The system captures unstructured natural language input from a sales representative, extracts complex entities (Attendees, Materials, Outcomes), and automatically populates a structured React/Redux form. It solves key challenges like deterministic timekeeping and hallucination prevention using a robust tool-driven architecture.

---

## 🚀 Tech Stack

### Frontend
* **Framework:** React 18
* **State Management:** Redux Toolkit
* **Styling:** Tailwind CSS
* **HTTP Client:** Axios

### Backend
* **Framework:** FastAPI (Python 3.12)
* **Server:** Uvicorn
* **Database:** SQLite (`crm_v2.db`) for persistent interaction logging

### AI Engine
* **Orchestration:** LangGraph (StateGraph Architecture)
* **LLM:** Groq API (`llama-3.3-70b-versatile`)
* **Tooling:** Custom Python functions with Pydantic validation

---

## 🏗️ System Architecture

### 1. The AI Agent (Backend)
The backend utilizes a **LangGraph ReAct Agent** with a custom "One-Shot" graph structure to prevent recursion loops.
* **Deterministic Timekeeping:** The Python runtime aggressively overwrites any time/date hallucinated by the LLM with the precise server timestamp (`datetime.now()`).
* **Robust Tooling:** The `log_interaction` tool uses `Optional` types and safe defaults to prevent crashes when the AI skips fields.
* **Schema Validation:** Pydantic models ensure that the LLM outputs strict JSON structures (e.g., converting "Dr. House and Dr. Chase" into `["Dr. House", "Dr. Chase"]`).

### 2. The UI (Frontend)
The React frontend listens for structured JSON commands from the backend:
* **`FILL_FORM`**: Populates text fields and maps arrays to interactive UI tags.
* **`UPDATE_FIELD`**: Allows for granular corrections (e.g., "Change sentiment to Negative").

---

## 🛠️ Implemented Tools

| Tool Name | Type | Description |
| :--- | :--- | :--- |
| **`log_interaction`** | **Mandatory** | Extracts HCP Name, Date, Time, Topics, Attendees, Materials, Samples, Sentiment, Outcomes, and Follow-up. Forces live time injection and logs the full record to SQLite. |
| **`edit_interaction`** | **Mandatory** | Modifies specific form fields based on natural language correction commands (e.g., "Change sentiment to Positive"). |
| **`get_hcp_profile`** | *Context* | Retrieves static context about the HCP (Specialty, Hospital) to simulate a database lookup. |
| **`get_product_info`** | *Knowledge* | Fetches product efficacy/safety data to answer rep queries during logging. |
| **`schedule_follow_up`** | *Action* | Simulates an external calendar booking action based on the conversation. |

---

## ⚡ Installation & Setup

### Prerequisites
* Python 3.10+
* Node.js & npm
* Groq API Key

### 1. Backend Setup
1.  Navigate to the root directory:
    ```bash
    cd HCP_CRM_Project
    ```
2.  Create and activate a virtual environment (optional but recommended):
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
    *(Ensure `fastapi`, `uvicorn`, `langchain-groq`, `langgraph`, `pydantic`, and `python-dotenv` are installed)*
4.  Set your Groq API Key:
    ```bash
    export GROQ_API_KEY="your_actual_api_key_here"
    ```
5.  Start the Backend Server:
    ```bash
    uvicorn backend.main:app --reload
    ```
    *Server running at: `http://127.0.0.1:8000`*

### 2. Frontend Setup
1.  Open a new terminal and navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the React App:
    ```bash
    npm start
    ```
    *Client running at: `http://localhost:3000`*

---

## 🧪 Usage Scenarios

### Scenario 1: Complex Logging (Smart Fill)
**Prompt:**
> "Log a meeting with Dr. House regarding Lupus. Attendees: Dr. Chase. Shared: MRI Scan. Sentiment: Negative. Outcome: Patient unstable. Follow up: Schedule biopsy."

**Result:**
* **HCP:** Dr. House
* **Attendees:** [Dr. Chase] (Tag)
* **Materials:** [MRI Scan] (Tag)
* **Sentiment:** Negative (Checked)
* **Date/Time:** **Auto-filled with current live server time.**
* **Database:** Record saved to `crm_v2.db`.

### Scenario 2: Correction (Edit Mode)
**Prompt:**
> "Change sentiment to Positive."

**Result:**
* The `edit_interaction` tool is called.
* Only the "Positive" checkbox is updated; all other data remains value.

### Scenario 3: Live Time Injection
**Prompt:**
> "Log a call right now."

**Result:**
* The AI passes empty strings for date/time.
* The Python backend detects this and injects `datetime.now()`.
* The form displays the exact current date and time.
