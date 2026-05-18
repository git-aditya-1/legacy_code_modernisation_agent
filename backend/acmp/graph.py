from langgraph.graph import START, END, StateGraph
from acmp.state import AgentState
from acmp.agents.auditor import auditor_node
from acmp.agents.engineer import engineer_node
from acmp.agents.tester import tester_node
from acmp.agents.optimiser import optimizer_node

MAX_ITERATION = 3

def retry(state):
    """
    Determines if the pipeline should continue to Optimizer or Stop.
    """
    error = state.get("error_logs")
    
    # SUCCESS CRITERIA:
    # 1. No errors at all
    # 2. Execution timeout (accepted as success per requirements)
    timeout_msg = "Execution timed out (possible infinite loop)."
    
    if error is None or error == timeout_msg:
        return END
        
    # If there are real errors, check the iteration count
    if state.get("itr", 0) < MAX_ITERATION: # Assuming MAX_ITERATIONS = 3
        return "optimizer"
        
    return END

#Building graph
builder = StateGraph(AgentState)

#adding nodes:
builder.add_node("auditor", auditor_node)
builder.add_node("engineer", engineer_node)
builder.add_node("tester", tester_node)
builder.add_node("optimizer", optimizer_node)

builder.set_entry_point("auditor")

builder.add_edge("auditor", "engineer")
builder.add_edge("engineer", "tester")

builder.add_conditional_edges("tester", retry)

builder.add_edge("optimizer", "tester")

graph = builder.compile()