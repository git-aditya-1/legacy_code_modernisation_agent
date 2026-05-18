# ACMP — Agentic Code Modernization Pipeline

ACMP is an AI-powered platform that modernizes legacy codebases using a multi-agent workflow.

Instead of simply rewriting code with a single AI prompt, ACMP uses multiple specialized agents that analyze, rewrite, test, and optimize code automatically.

---

# Features

- Multi-agent AI workflow
- Legacy code modernization
- Automatic code auditing
- AI-powered code rewriting
- Functional testing pipeline
- Code optimization system
- FastAPI backend
- React + Tailwind frontend
- LangGraph orchestration
- Groq LLM integration
- Cost-efficient execution flow

---

# Agent Workflow

## 1. Auditor Agent
Analyzes legacy code for:
- Bugs
- Security vulnerabilities
- Deprecated patterns
- Technical debt

## 2. Engineer Agent
Modernizes the code using:
- Latest standards
- Better architecture
- Improved readability
- Cleaner implementations

## 3. Tester Agent
Runs validation tests to:
- Verify functionality
- Detect runtime errors
- Ensure output consistency

## 4. Optimizer Agent
Improves:
- Performance
- Maintainability
- Code quality

---

# Smart Early Exit System

To reduce unnecessary API usage and improve speed:

- If testing succeeds → pipeline stops instantly
- If execution times out → pipeline safely exits
- Prevents infinite retry loops
- Saves API cost and execution time

---

# Tech Stack

## Backend
- FastAPI
- Python 3.10+
- LangGraph

## Frontend
- React.js
- Tailwind CSS
- Vite
- Lucide Icons

## AI Models
- Groq API

---

# Project Structure

```bash
ACMP/
│
├── backend/
├── frontend/
├── agents/
├── workflows/
├── tests/
├── outputs/
├── .env
├── requirements.txt
└── README.md
