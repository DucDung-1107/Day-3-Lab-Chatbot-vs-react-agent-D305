# 📊 BÁO CÁO GIÁM SÁT & ĐÁNH GIÁ (OBSERVABILITY TRACE LOGS)
*Người thực hiện: Role 5*

---

## 🎯 1. BẢNG CHẤM ĐIỂM AGENTIC FIT (SCORING MATRIX)
*Chủ đề: Trợ lý tìm thuê phòng trọ & đặt lịch xem nhà*

| Tiêu chí | Điểm (1-5) | Lý do đánh giá |
| :--- | :---: | :--- |
| 🧠 **Multi-step Reasoning** | `5/5` | Cần suy luận qua 2 bước: Tìm phòng phù hợp -> Đặt lịch hẹn xem phòng. |
| 🛠️ **Tool Interaction** | `5/5` | Bắt buộc gọi Tool `search_rentals` để lấy giá/mã phòng và `book_viewing` để lưu lịch. |
| 🔀 **Dynamic Decision** | `5/5` | Nếu tìm thấy phòng thì mới đặt lịch, nếu không thấy thì phải thông báo dừng lại. |
| ⏳ **Long Horizon** | `4/5` | Phải ghi nhớ `listing_id` từ kết quả tìm kiếm để truyền vào tool đặt lịch. |
| **TỔNG ĐIỂM FIT** | **19/20** | **KẾT LUẬN: BÀI TOÁN RẤT NÊN DÙNG REACT AGENT!** |

---

## 🔍 2. SO SÁNH PHẢN HỒI (TEST CASE #5)

**Câu hỏi**: *"Tìm phòng trọ ở Quận Đống Đa tầm giá 4-6 triệu. Hãy đặt lịch xem cho tôi vào chiều mai lúc 14:00."*

### 🤖 Chatbot Baseline (Không có Tool):
* **Phản hồi**: *"Dạ, để tìm phòng trọ tại Quận Đống Đa và đặt lịch, bạn vui lòng liên hệ hotline..."*
* **Nhận xét**: Chatbot thông thường không thể truy cập dữ liệu phòng và không thể thực thi việc đặt lịch.

### 🧠 ReAct Agent (Agent V1):
* **Thought 1**: Cần tìm phòng trọ ở Đống Đa giá dưới 6 triệu.
* **Action 1**: `search_rentals["Đống Đa", "6000000", "phòng trọ"]`
* **Observation 1**: `Tìm thấy 1 phòng phù hợp: - [RT004] Đống Đa, Hà Nội | phòng trọ | 18m2 | 2,800,000 VNĐ/tháng`
* **Thought 2**: Đã tìm thấy phòng RT004, ngân sách thỏa mãn. Giờ tiến hành đặt lịch.
* **Action 2**: `book_viewing["RT004", "29/07/2026", "14:00"]`
* **Observation 2**: `Đặt lịch thành công! Mã booking: BK001. Xem phòng [RT004] tại Đống Đa, Hà Nội...`
* **Final Answer**: *"Tôi đã tìm được phòng trọ mã RT004 tại Đống Đa và đặt lịch thành công cho bạn vào 14:00 ngày mai. Mã xác nhận là BK001!"*
* **Nhận xét**: Agent hoàn thành tốt nhiệm vụ nhờ kết hợp gọi công cụ.

---

## 🛡️ 3. FAILED TRACE & RECOVERY (NÂNG CẤP AGENT V2)
*Phân tích 3 lỗi (Failure Modes) theo yêu cầu và cách Agent V2 khắc phục.*

### ❌ Lỗi 1: Unknown Tool (Gọi tool không có trong hệ thống)
* **Câu hỏi bẫy:** *"Tìm mua điện thoại iPhone 15"*
* **Biểu hiện thực tế (Agent V1):** Agent gọi `Action: search_product["iPhone 15"]`. Code Python văng lỗi `KeyError` do tool không tồn tại. App bị sập.
* **Cách Agent V2 khắc phục (Safe Fallback):** Trả về chuỗi `LỖI: Tool 'search_product' không tồn tại, các tool hợp lệ gồm: [search_rentals, book_viewing]`. Agent đọc được, tự sửa sai và trả lời: *"Xin lỗi, tôi chỉ hỗ trợ tìm nhà thuê, không hỗ trợ tìm sản phẩm."*

### ❌ Lỗi 2: Malformed Args (Sai cú pháp tham số)
* **Câu hỏi bẫy:** *"Đặt lịch xem căn hộ R105 vào ngày mai"*
* **Biểu hiện thực tế (Agent V1):** Agent gọi `Action: book_viewing["R105", "Ngày mai", "Chiều"]`. Tool không hiểu chữ "Ngày mai" (sai định dạng DD/MM/YYYY) nên báo lỗi Exception.
* **Cách Agent V2 khắc phục (Safe Fallback):** Tool trả về `LỖI: preferred_date phải đúng định dạng DD/MM/YYYY`. Agent tự phục hồi và hỏi lại khách: *"Bạn vui lòng cung cấp ngày giờ cụ thể (ngày/tháng/năm) để tôi đặt lịch nhé."*

### ❌ Lỗi 3: Repeated Action (Lặp vô hạn)
* **Biểu hiện thực tế (Agent V1):** Agent gọi sai mã phòng nhiều lần nhưng không tự thoát ra được, cứ lặp đi lặp lại `Action` cũ khiến chương trình bị treo (vòng lặp while True).
* **Cách Agent V2 khắc phục (Safe Fallback):** Code app cài giới hạn `MAX_ITERATIONS = 4`. Nếu quá số bước mà chưa xong, vòng lặp tự ngắt và tung phanh an toàn: *"Xin lỗi, tôi đã thử nhiều bước nhưng chưa xử lý được yêu cầu của bạn, vui lòng cung cấp thêm thông tin rõ ràng hơn."*
