import json
from openai import OpenAI
import os
from tools import search_apartments, check_availability

# Read from root .env because we run using the virtual env
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

# The user might have put the OpenAI key in GEMINI_API_KEY
api_key = os.getenv("OPENAI_API_KEY")
if api_key == "your_openai_api_key_here" or not api_key:
    api_key = os.getenv("GEMINI_API_KEY")

client = OpenAI(api_key=api_key)

SYSTEM_PROMPT = """Bạn là một trợ lý AI thông minh chuyên tìm kiếm và đặt lịch xem nhà trọ/phòng trọ.
Bạn CÓ CÁC CÔNG CỤ (TOOLS) sau đây để sử dụng:
1. search_apartments(location_keyword: str): Tìm kiếm nhà trọ theo khu vực/địa chỉ. Trả về thông tin ID, giá, địa chỉ.
2. check_availability(apartment_id: str, datetime_str: str): Kiểm tra xem phòng có thể xem vào thời gian yêu cầu không.

LUẬT CỦA BẠN:
- BƯỚC 1: Nếu người dùng muốn tìm nhà/đặt lịch ở một khu vực, bạn PHẢI dùng `search_apartments` để tìm.
- BƯỚC 2: Nếu người dùng có yêu cầu thời gian, bạn PHẢI dùng `check_availability` để kiểm tra (chỉ dùng sau khi đã có ID nhà trọ).
- BƯỚC 3: Nếu kết quả báo giờ không khả dụng (ví dụ ngoài giờ hành chính hoặc trùng lịch 27-7-2026), bạn PHẢI từ chối và hỏi người dùng đổi thời gian khác (hãy lập luận rõ ràng).
- CHÚ Ý: Luôn nhắc nhở người dùng về giá cả, giá điện, giá nước (có thể giả định điện 3.5k/chữ, nước 100k/người nếu không có trong data) khi tư vấn phòng.
- ĐỊNH DẠNG TRẢ VỀ: Bạn phải luôn tuân thủ chuẩn ReAct:
  Thought: [Suy nghĩ của bạn về bước tiếp theo]
  Action: [Tên công cụ cần gọi, ví dụ: search_apartments hoặc check_availability]
  Action Input: [Tham số truyền vào cho công cụ]
  
  Sau khi nhận được Observation từ công cụ, bạn sẽ tiếp tục Thought.
  Khi đã hoàn thành, hãy trả về kết quả cuối cùng theo cú pháp:
  Final Answer: [Câu trả lời giao tiếp với người dùng]

NẾU người dùng cung cấp thông tin không đầy đủ, hãy hỏi thêm. 
NẾU đã tìm thấy phòng và chốt được giờ, thông báo đặt lịch nháp thành công chờ xác nhận.
"""

def run_react_agent(user_query: str):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": user_query}]
    
    max_steps = 7
    step = 0
    final_answer = ""
    last_apartments_found = []

    while step < max_steps:
        step += 1
        response = client.chat.completions.create(
            model="gpt-4o-mini", # Using lightweight model
            messages=messages,
            temperature=0.2,
            stop=["Observation:"]
        )
        
        reply = response.choices[0].message.content.strip()
        print(f"\n--- STEP {step} ---")
        print(reply)
        messages.append({"role": "assistant", "content": reply})
        
        if "Final Answer:" in reply:
            final_answer = reply.split("Final Answer:")[-1].strip()
            break
            
        if "Action:" in reply and "Action Input:" in reply:
            action_line = [line for line in reply.split('\n') if line.startswith("Action:")]
            input_line = [line for line in reply.split('\n') if line.startswith("Action Input:")]
            
            if action_line and input_line:
                action = action_line[0].replace("Action:", "").strip()
                action_input = input_line[0].replace("Action Input:", "").strip()
                
                obs = ""
                if action == "search_apartments":
                    obs = search_apartments(action_input)
                    try:
                        parsed = json.loads(obs)
                        if isinstance(parsed, list):
                            last_apartments_found = parsed
                    except:
                        pass
                elif action == "check_availability":
                    # Parse input which could be "ID, Date"
                    parts = [p.strip() for p in action_input.split(",")]
                    if len(parts) >= 2:
                        obs = check_availability(parts[0], parts[1])
                    else:
                        obs = check_availability("1", action_input)
                else:
                    obs = "Error: Unknown tool."
                
                print(f"Observation: {obs}")
                messages.append({"role": "user", "content": f"Observation: {obs}"})
            else:
                messages.append({"role": "user", "content": "Observation: Missing Action Input."})
        else:
            # Fallback if model forgets format
            messages.append({"role": "user", "content": "Observation: You forgot to format as Action/Action Input or Final Answer."})

    if not final_answer:
        final_answer = "Xin lỗi, tôi đã xử lý quá lâu và không thể đưa ra câu trả lời."

    # Return structured JSON for the frontend
    # Add fake image and standard fields to the apartments
    formatted_results = []
    for apt in last_apartments_found[:3]: # top 3
        formatted_results.append({
            "id": apt.get("id", "1"),
            "title": apt.get("title", "Phòng trọ"),
            "price": apt.get("price", "2.0 triệu"),
            "published": "Hôm nay",
            "acreage": apt.get("acreage", "20.0 m2"),
            "address": apt.get("address", ""),
            "image": "https://images.unsplash.com/photo-1596276020587-804acffc87da?w=500&auto=format&fit=crop&q=60"
        })

    return {
        "message": final_answer,
        "results": formatted_results
    }
