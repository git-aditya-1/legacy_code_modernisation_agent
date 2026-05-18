# import streamlit as st
# import os
# import sys
# from pathlib import Path

# # Add backend to path to import your ACMP components
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

# from graph import graph  # Importing the compiled LangGraph
# from utils.file_loader import read_file, get_relative_path

# st.set_page_config(page_title="ACMP | Code Modernizer", layout="wide")

# st.title("Agentic Code Modernization Pipeline")
# st.markdown("Transform legacy code using a self-healing multi-agent system.")

# # --- Sidebar Settings ---
# with st.sidebar:
#     st.header("Pipeline Configuration")
#     input_dir = st.text_input("Source Directory", value="dummy_test")
#     output_dir = st.text_input("Output Directory", value="modernized_code")
    
#     if st.button("Reset Session"):
#         st.session_state.clear()
#         st.rerun()

# # --- Main Logic ---
# if st.button("Start Modernization Process", type="primary"):
#     if not os.path.exists(input_dir):
#         st.error(f"Directory '{input_dir}' not found!")
#     else:
#         # Scan for files using your existing logic
#         from utils.file_loader import scan_directory
#         files = list(scan_directory(input_dir))
        
#         if not files:
#             st.warning("No supported files found.")
#         else:
#             progress_bar = st.progress(0)
            
#             for idx, file_path in enumerate(files):
#                 st.divider()
#                 st.subheader(f"📄 Processing: `{os.path.basename(file_path)}`")
                
#                 # Container for side-by-side view
#                 col1, col2 = st.columns(2)
                
#                 with col1:
#                     st.markdown("**Original Code**")
#                     original_code = read_file(file_path)
#                     st.code(original_code, language="python")
                
#                 # Initialize State
#                 state = {
#                     "file_path": file_path,
#                     "original_code": original_code,
#                     "transformation_plan": None,
#                     "current_code": None,
#                     "error_logs": None,
#                     "itr": 0,
#                 }
                
#                 with st.spinner(f"Agents (Auditor -> Engineer -> Tester) working..."):
#                     # Invoke your graph
#                     result = graph.invoke(state)
                
#                 with col2:
#                     st.markdown("**Modernized Code**")
#                     st.code(result["current_code"], language="python")
                    
#                     if result["error_logs"] in [None, "Execution timed out (possible infinite loop)."]:
#                         st.success("✅ Modernization Successful")
#                     else:
#                         st.error(f"❌ Failed after {result['itr']} iterations")
#                         with st.expander("View Error Logs"):
#                             st.text(result["error_logs"])
                
#                 # Update progress
#                 progress_bar.progress((idx + 1) / len(files))
            
#             st.balloons()
#             st.success("Modernization Pipeline Finished!")


import streamlit as st
import os
import sys
from pathlib import Path

# Setup path to backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from graph import graph
from utils.file_loader import scan_directory, read_file, get_relative_path
from main import save_modernized_file

st.set_page_config(page_title="ACMP Dashboard", layout="wide")

# Persistent CSS for highlighting
st.markdown("""
<style>
    .step-box { padding: 10px; border-radius: 5px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #999; background-color: #f9f9f9; }
    .step-active { border: 2px solid #FF4B4B; color: #FF4B4B; background-color: #fff1f1; transform: scale(1.05); transition: 0.3s; }
</style>
""", unsafe_allow_html=True)

st.title("ACMP: Agentic Modernization")

with st.sidebar:
    st.header("Pipeline Settings")
    input_dir = st.text_input("Legacy Code Folder", value="dummy_test")
    output_dir = st.text_input("Output Folder", value="modernized_code")

# --- Helper function to render steps into a specific container ---
def render_steps(container, active_step=None):
    steps = ["auditor", "engineer", "tester", "optimizer"]
    cols = container.columns(len(steps))
    for i, step in enumerate(steps):
        # Match step name with graph node names
        is_active = "step-active" if step == active_step else ""
        cols[i].markdown(f'<div class="step-box {is_active}">{step.capitalize()}</div>', unsafe_allow_html=True)

if st.button("Run Pipeline", type="primary"):
    if not os.path.exists(input_dir):
        st.error("Input directory not found.")
    else:
        files = list(scan_directory(input_dir))
        
        for file_path in files:
            st.subheader(f"📄 Processing: `{os.path.basename(file_path)}`")
            
            # 1. Placeholders to prevent UI jumping/duplication
            # Use st.empty() to create a single spot that we keep overwriting
            step_placeholder = st.empty() 
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("**Original Code**")
                original_content = read_file(file_path)
                st.code(original_content, language="python")

            # Initialize code display in col2
            output_placeholder = col2.empty()
            output_placeholder.info("Waiting for Engineer...")

            # 2. Initial State
            state = {
                "file_path": file_path,
                "original_code": original_content,
                "transformation_plan": None,
                "current_code": "",
                "error_logs": None,
                "itr": 0,
            }

            # 3. Stream the Graph to Sync UI with Nodes
            # 'updates' mode gives us the node name as it completes
            for chunk in graph.stream(state, stream_mode="updates"):
                for node_name, output in chunk.items():
                    # Update the animation block in-place
                    with step_placeholder.container():
                        render_steps(st, active_step=node_name)
                    
                    # Update the code display if the engineer or optimizer produced code
                    if "current_code" in output and output["current_code"]:
                        with output_placeholder.container():
                            st.markdown("**Current Modernized Code**")
                            st.code(output["current_code"], language="python")
                    
                    # Store latest result for the save button
                    final_result = output 

            # 4. Final Result & Corrected Save Functionality
            # After the loop, the placeholder shows the final state
            if final_result.get("error_logs") in [None, "Execution timed out (possible infinite loop)."]:
                st.success("Modernization Successful!")
                
                # Logic to use the user-defined output_dir
                rel_path = get_relative_path(file_path, input_dir)
                
                # FIX: We use a unique key for the button to avoid state conflicts
                if st.button(f"💾 Save to {output_dir}", key=f"save_{file_path}"):
                    # Pass the content directly to your main.py function
                    save_modernized_file(rel_path, final_result["current_code"])
                    st.toast(f"Saved: {rel_path}")
            else:
                st.error("Failed after maximum retries.")
                st.expander("Show Errors").text(final_result["error_logs"])
            
            st.divider()