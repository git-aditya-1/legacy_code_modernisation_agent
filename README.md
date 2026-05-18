# ACMP: Agentic Code Modernization Pipeline

ACMP is a sophisticated AI-driven tool that automates the tedious process of upgrading legacy source code. Unlike simple LLM wrappers, ACMP employs a **multi-agent orchestration** strategy to ensure code is not just rewritten, but audited, tested, and optimized.



## The Agentic Workflow
The system consists of four specialized agents working in a stateful loop:

1.  **Auditor Agent**: Analyzes legacy code for bugs, security risks, and technical debt.
2.  **Engineer Agent**: Performs the heavy lifting by rewriting the code using modern standards.
3.  **Tester Agent**: Executes the modernized code against virtual test cases to ensure functional parity.
4.  **Optimizer Agent**: Refines the code further if the Tester finds errors or if performance can be improved.

### Cost-Efficient "Early Exit"
To maximize efficiency and minimize API costs, the pipeline implements a smart exit strategy:
* **Instant Success**: If the Tester Agent reports zero errors, the pipeline finishes immediately.
* **Safe Timeout**: If code execution times out (preventing infinite loops), the system accepts it as a success state rather than retrying indefinitely, allowing the user to review the output.

## Tech Stack
* **Backend**: FastAPI, LangGraph, Python 3.10+
* **Frontend**: React.js, Tailwind CSS, Lucide Icons, Vite
* **AI Models**: Groq


Create a new .env file with the API keys to run the project
