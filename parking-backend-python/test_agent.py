import sys
import io
import json
import os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from agent import run_react_agent

def run_eval():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(base_dir, "config", "test_cases.json")
    
    with open(config_path, "r", encoding="utf-8") as f:
        tests = json.load(f)
    
    test_ids = [4, 7, 8]
    selected_tests = [t for t in tests if t["id"] in test_ids]
    
    trace_output = ""
    
    for t in selected_tests:
        trace_output += f"\n### TEST CASE #{t['id']}: {t['category']}\n"
        trace_output += f"**Câu hỏi**: *\"{t['question']}\"*\n\n"
        trace_output += "**Quá trình ReAct suy luận:**\n"
        trace_output += "```text\n"
        
        # We need to capture stdout during the agent run to get Thought/Action/Observation
        old_stdout = sys.stdout
        new_stdout = io.StringIO()
        sys.stdout = new_stdout
        
        try:
            res = run_react_agent(t['question'])
            agent_output = new_stdout.getvalue()
        finally:
            sys.stdout = old_stdout
            
        trace_output += agent_output
        trace_output += "```\n"
        trace_output += f"**Final JSON Answer**: \n```json\n{json.dumps(res, ensure_ascii=False, indent=2)}\n```\n"
        trace_output += "---\n"
        
    print(trace_output)
    
    # Append to trace_eval.md
    trace_file = os.path.join(base_dir, "docs", "trace_eval.md")
    with open(trace_file, "a", encoding="utf-8") as f:
        f.write("\n## 🚀 4. KẾT QUẢ TEST REAL REACT AGENT VỚI TEST_CASES.JSON\n")
        f.write(trace_output)

if __name__ == "__main__":
    run_eval()
