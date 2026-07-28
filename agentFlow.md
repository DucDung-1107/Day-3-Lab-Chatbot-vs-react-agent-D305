# 🧠 SƠ ĐỒ LUỒNG HOẠT ĐỘNG CỦA AI AGENT (AGENT FLOW)

Tài liệu này mô tả chi tiết luồng hoạt động (workflow), sơ đồ trạng thái (state machine) và mô hình quyết định kết hợp (hybrid decision flow) của hệ thống AI Agent trong bài Lab.

---

## 🗺️ 1. Tổng quan 4 Cấp độ Tiến hóa của Hệ thống AI
Hệ thống trải qua 4 cấp độ tăng dần về độ tự chủ và khả năng tương tác:

```mermaid
graph TD
    classDef levelStyle fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    
    L1[Cấp 1: Rule-Based Bot<br>Khớp từ khóa if/else cố định, không LLM]:::levelStyle --> 
    L2[Cấp 2: LLM Chatbot<br>Sinh text mượt mà, không thể gọi Tool]:::levelStyle --> 
    L3[Cấp 3: Reactive Agent<br>ReAct Loop: Thought -> Action -> Observation]:::levelStyle --> 
    L4[Cấp 4: Autonomous Agent<br>Planning, Memory & Goal Evaluation]:::levelStyle
```

---

## 🔄 2. Sơ đồ trạng thái ReAct Agent Loop (Cấp độ 3)
ReAct Agent hoạt động theo vòng lặp phản hồi khép kín (closed-loop), kết hợp giữa suy luận suy nghĩ (**Thought**), thực thi công cụ (**Action**) và quan sát kết quả (**Observation**).

```mermaid
stateDiagram-v2
    [*] --> Nhận_Yêu_Cầu: Người dùng gửi câu hỏi
    Nhận_Yêu_Cầu --> CallLLM: Khởi tạo Prompt hệ thống + lịch sử

    state CallLLM {
        [*] --> Phân_Tích_LLM
        Phân_Tích_LLM --> Sinh_Thought: Tạo lập suy nghĩ (Thought)
    }

    CallLLM --> ExecuteTool: Phát hiện dòng Action: tool_name[args]
    CallLLM --> FinalAnswer: Phát hiện dòng Final Answer: ...
    CallLLM --> SafeFallback: Chạm giới hạn MAX_ITERATIONS (Phanh Guardrail)

    state ExecuteTool {
        [*] --> Kiểm_Tra_Whitelist: Có nằm trong ALLOWED_TOOLS?
        Kiểm_Tra_Whitelist --> Chạy_Hàm_Python: Hợp lệ
        Kiểm_Tra_Whitelist --> Trả_Lỗi_Tool: Không hợp lệ
        Chạy_Hàm_Python --> Bắt_Lỗi_Exceptions: Có try/except bọc toàn bộ
        Bắt_Lỗi_Exceptions --> Trả_Observation: Thành công
        Bắt_Lỗi_Exceptions --> Trả_Lỗi_Tool: Lỗi khi chạy (LỖI: ...)
    }

    ExecuteTool --> AppendObservation: Ghi nhận dữ liệu thực tế (Observation)
    AppendObservation --> CallLLM: Quay lại vòng lặp suy luận tiếp theo

    FinalAnswer --> [*]: Trả kết quả cuối cùng cho người dùng
    SafeFallback --> [*]: Trả lời thông báo Fallback an toàn cho người dùng
```

### Các chốt chặn An toàn (Guardrails) được áp dụng:
1. **Giới hạn số bước (`MAX_ITERATIONS = 4`)**: Tránh vòng lặp vô hạn nếu LLM bị lặp Thought-Action.
2. **Khống chế thời gian chạy (`TIMEOUT_SECONDS = 10`)**: Ngăn tool chạy quá lâu gây nghẽn luồng.
3. **Whitelist Tools**: Chỉ cho phép gọi các công cụ đã đăng ký (`search_rentals`, `book_viewing`).
4. **Bảo vệ Side-Effect**: Chỉ gọi tool thay đổi trạng thái hệ thống (`book_viewing`) khi có `listing_id` hợp lệ được sinh ra từ kết quả tra cứu thật trước đó.

---

## 🔀 3. Sơ đồ Phân luồng Quyết định kết hợp (Hybrid Decision Flowchart)
Để tối ưu chi phí (Token) và tốc độ phản hồi (Latency), hệ thống áp dụng cơ chế phân luồng Hybrid. Các câu hỏi đơn giản không cần gọi tool sẽ đi thẳng qua Chatbot thông thường.

```mermaid
flowchart TD
    Start([Nhận Query từ Người dùng]) --> CheckType{Phân loại yêu cầu?}
    
    %% Đường đi Chatbot Baseline
    CheckType -- "Câu hỏi đơn giản / Chào hỏi / Hỏi FAQ chung" --> PathChatbot[Đường dẫn Chatbot Baseline]
    PathChatbot --> CallLLM_Simple[Gọi LLM trực tiếp với Chatbot Prompt]
    CallLLM_Simple --> DirectResponse([Trả lời trực tiếp người dùng])

    %% Đường đi ReAct Agent
    CheckType -- "Cần tra cứu Real-time / Đặt lịch hẹn" --> PathAgent[Đường dẫn ReAct Agent]
    PathAgent --> InitReAct[Khởi tạo ReAct Prompt & Công cụ]
    
    subgraph ReAct_Loop [Vòng lặp ReAct]
        Step{Kiểm tra Step < MAX_ITERATIONS?}
        Step -- Yes --> RunLLM[Gọi LLM sinh Thought & Action]
        RunLLM --> ParseOutput{Parse kết quả?}
        
        ParseOutput -- "Phát hiện Action" --> CallTool[Thực thi Tool tương ứng]
        CallTool --> GetObs[Ghi nhận Observation]
        GetObs --> LoopBack[Cập nhật context lịch sử]
        LoopBack --> Step
        
        ParseOutput -- "Phát hiện Final Answer" --> SetFinal[Thiết lập Câu trả lời cuối cùng]
        
        Step -- No / Đạt giới hạn --> TriggerFallback[Kích hoạt Safe Fallback]
    end
    
    SetFinal --> ResponseAgent([Trả lời kết quả chi tiết kèm mã Booking])
    TriggerFallback --> ResponseFallback([Trả lời thông báo Fallback an toàn])
```

---

## 🧠 4. Luồng hoạt động của Trợ lý Thuê phòng (Rental Agent Flow)
Đây là quy trình nghiệp vụ cụ thể cho ứng dụng tìm nhà trọ và đặt lịch xem phòng (`parking-backend-python` & `src/tools.py`):

```mermaid
flowchart TD
    UserQuery[Yêu cầu của người dùng] --> Step1[Thought: Cần tìm phòng theo khu vực và ngân sách]
    Step1 --> Action1[Action: search_rentals/search_apartments]
    Action1 --> Obs1[Observation: Trả về danh sách phòng kèm mã listing_id]
    
    Obs1 --> Step2{Người dùng có yêu cầu đặt lịch hẹn?}
    
    Step2 -- "Không" --> Final1[Final Answer: Tư vấn thông tin phòng, giá điện/nước và gửi danh sách]
    
    Step2 -- "Có (Kèm ngày & giờ)" --> Step3[Thought: Cần kiểm tra độ khả dụng và tiến hành đặt lịch]
    Step3 --> Action2[Action: book_viewing/check_availability]
    Action2 --> Obs2[Observation: Trả về trạng thái Đặt lịch thành công hoặc Trùng lịch/Lỗi giờ]
    
    Obs2 --> CheckStatus{Trạng thái đặt lịch?}
    CheckStatus -- "Thành công" --> Final2[Final Answer: Xác nhận mã Booking, địa chỉ phòng, ngày giờ xem phòng]
    CheckStatus -- "Trùng lịch / Lỗi giờ" --> FallbackClarify[Thought: Lịch bị trùng hoặc ngoài giờ hành chính. Cần đề xuất đổi lịch hoặc hỏi lại người dùng]
    FallbackClarify --> Final3[Final Answer: Giải thích lý do và gợi ý đổi sang các khung giờ trống khác]
```

---

## 💾 5. Sơ đồ Hoạt động của Autonomous Goal Agent (Cấp độ 4)
Cấp độ tự chủ cao nhất có khả năng tự chia nhỏ mục tiêu (Planning) và duy trì bộ nhớ (Memory).

```mermaid
flowchart TD
    InputGoal([Mục tiêu lớn từ User]) --> InitAgent[Khởi tạo Agent: Thiết lập Goal & Khởi tạo Memory]
    InitAgent --> Planning[Tự lập kế hoạch và chia nhỏ các bước cần làm]
    
    subgraph Execution_Loop [Vòng lặp tự chủ]
        StepCheck{Còn bước cần thực hiện?}
        StepCheck -- Yes --> ExecStep[Thực hiện Step & Gọi Tool liên quan]
        ExecStep --> SaveMemory[Lưu kết quả của Step vào Memory]
        SaveMemory --> StepCheck
    end
    
    StepCheck -- No --> Eval[Goal Evaluation: Tự đánh giá mức độ hoàn thành]
    Eval --> Done{Hoàn thành 100%?}
    Done -- Yes --> FinalResponse([Xuất lịch trình & Kết quả cuối cùng])
    Done -- No --> RePlan[Điều chỉnh lại kế hoạch] --> Planning
```
