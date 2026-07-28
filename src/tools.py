"""
🛠️ TOOL REGISTRY & SCHEMAS (Dành cho Role 2: Tool & Spec Engineer)
Nơi khai báo tất cả các "món đồ nghề" mà ReAct Agent có thể gọi.

Mỗi tool tuân theo 8 tiêu chí chuẩn hóa (theo bảng đặc tả của lớp):
  Name | Purpose | Input schema | Output schema | Error semantics |
  Side effect | Example | Safety

Nguyên tắc bắt buộc: TOOL KHÔNG BAO GIỜ ĐƯỢC PHÉP QUĂNG EXCEPTION LÀM SẬP
CHƯƠNG TRÌNH. Mọi lỗi (input sai, thiếu dữ liệu, exception bất ngờ) đều phải
được bắt lại và trả về dưới dạng chuỗi bắt đầu bằng "LỖI: ..." để Agent tự
đọc và suy luận bước tiếp theo (Thought: Observation này là lỗi, tôi nên...).
"""


def get_weather(location: str) -> str:
    """
    Name: get_weather

    Purpose:
        Tra cứu thời tiết hiện tại của một thành phố. Dùng khi câu hỏi người
        dùng cần dữ liệu thời tiết thời gian thực. KHÔNG dùng để dự báo dài
        hạn hay lịch sử thời tiết (tool này không hỗ trợ).

    Input schema:
        location (str, required): Tên thành phố, không phân biệt hoa/thường,
            có dấu hoặc không dấu đều được. Ví dụ: 'Hà Nội', 'ha noi', 'TP.HCM'.

    Output schema:
        str: Chuỗi mô tả thời tiết dạng
             "Thời tiết {Tên TP}: {nhiệt độ}°C, {mô tả}, Độ ẩm {x}%."

    Error semantics:
        - location rỗng / không phải string / None -> trả về
          "LỖI: Tham số location không hợp lệ (phải là chuỗi không rỗng)."
        - location hợp lệ nhưng không có trong dữ liệu -> trả về
          "LỖI: Không tìm thấy dữ liệu thời tiết cho địa điểm '{location}'."
        - Không bao giờ raise Exception ra ngoài.

    Side effect:
        Read-only. Không ghi/thay đổi trạng thái hệ thống, không gọi API bên
        ngoài (đây là bản demo dùng dữ liệu giả lập cứng trong code).

    Example:
        >>> get_weather("Hà Nội")
        "Thời tiết Hà Nội: 28°C, Nắng nhẹ, Độ ẩm 65%."
        >>> get_weather("Paris")
        "LỖI: Không tìm thấy dữ liệu thời tiết cho địa điểm 'Paris'."

    Safety:
        Có bọc try/except toàn bộ thân hàm. Input sai kiểu (vd. số nguyên,
        None, list...) đều được validate trước, không để lỗi TypeError/
        AttributeError rò ra ngoài làm crash chương trình.
    """
    try:
        if not isinstance(location, str) or not location.strip():
            return "LỖI: Tham số location không hợp lệ (phải là chuỗi không rỗng)."

        loc_lower = location.strip().lower()

        if "hà nội" in loc_lower or "ha noi" in loc_lower:
            return "Thời tiết Hà Nội: 28°C, Nắng nhẹ, Độ ẩm 65%."
        elif "hồ chí minh" in loc_lower or "tp.hcm" in loc_lower or "hcm" in loc_lower:
            return "Thời tiết TP.HCM: 33°C, Nắng nóng, Có mây."
        elif "đà nẵng" in loc_lower or "da nang" in loc_lower:
            return "Thời tiết Đà Nẵng: 30°C, Gió nhẹ, Mát mẻ."
        else:
            return f"LỖI: Không tìm thấy dữ liệu thời tiết cho địa điểm '{location}'."

    except Exception as e:
        # Lưới an toàn cuối cùng: bất kể lỗi gì bất ngờ xảy ra cũng không crash
        return f"LỖI: Đã có sự cố khi tra cứu thời tiết ({str(e)})."


def search_flights(origin: str, destination: str) -> str:
    """
    Name: search_flights

    Purpose:
        Tra cứu chuyến bay khả dụng giữa hai địa điểm. Dùng khi người dùng
        hỏi về vé máy bay, lịch bay, giá vé giữa 2 thành phố.

    Input schema:
        origin (str, required): Nơi đi. Ví dụ: 'TP.HCM'.
        destination (str, required): Nơi đến. Ví dụ: 'Hà Nội'.
        (Cả hai đều bắt buộc và phải khác rỗng; không cần trùng khớp với
        danh sách thành phố của get_weather.)

    Output schema:
        str: Danh sách các chuyến bay tìm được, mỗi dòng gồm mã chuyến bay,
             giờ bay, giá vé. Ví dụ định dạng:
             "Chuyến bay từ {origin} -> {destination} ngày mai:\\n
              1. VN123 (08:00) - Giá: 1,500,000 VNĐ (Còn vé)\\n
              2. VJ456 (14:30) - Giá: 1,200,000 VNĐ (Còn vé)"

    Error semantics:
        - origin hoặc destination rỗng / không phải string / None -> trả về
          "LỖI: origin và destination đều phải là chuỗi không rỗng."
        - origin trùng destination -> trả về
          "LỖI: Điểm đi và điểm đến không được trùng nhau."
        - Không bao giờ raise Exception ra ngoài.

    Side effect:
        Read-only. Không đặt vé, không thay đổi trạng thái nào — đây chỉ là
        tra cứu (giả lập) khả dụng chuyến bay.

    Example:
        >>> search_flights("TP.HCM", "Hà Nội")
        "Chuyến bay từ TP.HCM -> Hà Nội ngày mai:\\n1. VN123 (08:00)..."
        >>> search_flights("Hà Nội", "Hà Nội")
        "LỖI: Điểm đi và điểm đến không được trùng nhau."

    Safety:
        Có bọc try/except toàn bộ thân hàm, validate kiểu dữ liệu và giá trị
        đầu vào trước khi xử lý, không để lỗi rò ra ngoài làm crash chương trình.
    """
    try:
        if not isinstance(origin, str) or not origin.strip():
            return "LỖI: origin và destination đều phải là chuỗi không rỗng."
        if not isinstance(destination, str) or not destination.strip():
            return "LỖI: origin và destination đều phải là chuỗi không rỗng."

        origin = origin.strip()
        destination = destination.strip()

        if origin.lower() == destination.lower():
            return "LỖI: Điểm đi và điểm đến không được trùng nhau."

        return (
            f"Chuyến bay từ {origin} -> {destination} ngày mai:\n"
            f"1. VN123 (08:00) - Giá: 1,500,000 VNĐ (Còn vé)\n"
            f"2. VJ456 (14:30) - Giá: 1,200,000 VNĐ (Còn vé)"
        )

    except Exception as e:
        return f"LỖI: Đã có sự cố khi tra cứu chuyến bay ({str(e)})."


# ============================================================
# ĐĂNG KÝ TOOL — Role 4 (Core Agent) sẽ dùng dictionary này để tra tên tool
# do LLM sinh ra (vd. "get_weather") ra hàm Python thực thi tương ứng.
# ============================================================
AVAILABLE_TOOLS = {
    "get_weather": get_weather,
    "search_flights": search_flights,
}


# ============================================================
# SELF-TEST — chạy độc lập file này để kiểm tra tool không crash với input sai
# ============================================================
if __name__ == "__main__":
    print("=== SELF-TEST: get_weather ===")
    test_cases_weather = ["Hà Nội", "ha noi", "Paris", "", None, 123, "   "]
    for case in test_cases_weather:
        try:
            result = get_weather(case)
            print(f"  Input: {case!r:15} -> {result}")
        except Exception as e:
            print(f"  ❌ CRASH với input {case!r}: {e}")

    print("\n=== SELF-TEST: search_flights ===")
    test_cases_flights = [
        ("TP.HCM", "Hà Nội"),
        ("Hà Nội", "Hà Nội"),
        ("", "Hà Nội"),
        (None, "Hà Nội"),
        (123, 456),
    ]
    for origin, dest in test_cases_flights:
        try:
            result = search_flights(origin, dest)
            print(f"  Input: {(origin, dest)!r:30} -> {result}")
        except Exception as e:
            print(f"  ❌ CRASH với input {(origin, dest)!r}: {e}")

    print("\n=== Danh sách tool đã đăng ký ===")
    for name in AVAILABLE_TOOLS:
        print(f"  ✅ {name}")

    print("\n🎉 Hoàn thành self-test: không có tool nào crash!")