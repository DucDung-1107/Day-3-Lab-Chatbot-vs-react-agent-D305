"""
🛠️ TOOL REGISTRY & SCHEMAS (Dành cho Role 2: Tool & Spec Engineer)
Chủ đề: TRỢ LÝ TÌM & ĐẶT LỊCH XEM NHÀ TRỌ / CĂN HỘ CHO THUÊ

Mỗi tool tuân theo 8 tiêu chí chuẩn hóa: Name, Purpose, Input schema,
Output schema, Error semantics, Side effect, Example, Safety.

Nguyên tắc bắt buộc: TOOL KHÔNG BAO GIỜ ĐƯỢC PHÉP QUĂNG EXCEPTION LÀM SẬP
CHƯƠNG TRÌNH. Mọi lỗi đều được bắt lại và trả về chuỗi bắt đầu bằng
"LỖI: ..." để Agent tự đọc và suy luận bước tiếp theo.
"""

# ============================================================
# DỮ LIỆU GIẢ LẬP (mock data) — thay cho database thật trong bản demo
# ============================================================
LISTINGS_DB = [
    {"id": "RT001", "location": "Cầu Giấy, Hà Nội", "price": 3500000, "type": "phòng trọ", "area": "20m2"},
    {"id": "RT002", "location": "Cầu Giấy, Hà Nội", "price": 5000000, "type": "chung cư mini", "area": "35m2"},
    {"id": "RT003", "location": "Quận 7, TP.HCM", "price": 6000000, "type": "căn hộ dịch vụ", "area": "40m2"},
    {"id": "RT004", "location": "Đống Đa, Hà Nội", "price": 2800000, "type": "phòng trọ", "area": "18m2"},
    {"id": "RT005", "location": "Quận 7, TP.HCM", "price": 4500000, "type": "phòng trọ", "area": "22m2"},
]

# Bộ nhớ lưu các lịch hẹn đã đặt (in-memory — mất khi restart chương trình,
# chỉ dùng cho mục đích demo. Bản thật cần lưu vào database).
BOOKINGS = []


def search_rentals(location: str, max_budget, room_type: str = "bất kỳ") -> str:
    """
    Name: search_rentals

    Purpose:
        Tìm kiếm phòng trọ / căn hộ cho thuê theo khu vực và ngân sách tối đa.
        Dùng khi người dùng hỏi "tìm phòng ở...", "có căn hộ nào giá dưới...".
        KHÔNG dùng để đặt lịch xem phòng (dùng book_viewing cho việc đó).

    Input schema:
        location (str, required): Khu vực cần tìm. Ví dụ: 'Cầu Giấy, Hà Nội'.
            Tìm kiếm dạng chứa chuỗi con (substring), không phân biệt hoa/thường.
        max_budget (str hoặc số, required): Ngân sách tối đa mỗi tháng (VNĐ).
            Có thể truyền dạng chuỗi số (vì Agent parser trả string), hàm sẽ
            tự động ép kiểu. Ví dụ: '5000000' hoặc 5000000.
        room_type (str, optional, mặc định "bất kỳ"): Loại phòng, một trong:
            'phòng trọ', 'chung cư mini', 'căn hộ dịch vụ', 'bất kỳ'.

    Output schema:
        str: Danh sách các phòng phù hợp, mỗi dòng gồm mã phòng (listing_id
             để dùng cho book_viewing), khu vực, giá, loại, diện tích.

    Error semantics:
        - location rỗng / không phải string -> "LỖI: Tham số location không hợp lệ."
        - max_budget không parse được thành số dương -> "LỖI: max_budget phải là số dương."
        - room_type không nằm trong danh sách hợp lệ -> "LỖI: room_type không hợp lệ.
          Chỉ chấp nhận: phòng trọ / chung cư mini / căn hộ dịch vụ / bất kỳ."
        - Không có phòng nào khớp -> "LỖI: Không tìm thấy phòng phù hợp với
          khu vực/ngân sách/loại phòng đã cho."
        - Không bao giờ raise Exception ra ngoài.

    Side effect:
        Read-only. Chỉ tra cứu trong LISTINGS_DB, không thay đổi dữ liệu.

    Example:
        >>> search_rentals("Cầu Giấy, Hà Nội", "5000000", "phòng trọ")
        "Tìm thấy 1 phòng phù hợp:\\n- [RT001] Cầu Giấy, Hà Nội | phòng trọ | 20m2 | 3,500,000 VNĐ/tháng"
        >>> search_rentals("Đà Lạt", "3000000")
        "LỖI: Không tìm thấy phòng phù hợp với khu vực/ngân sách/loại phòng đã cho."

    Safety:
        Có bọc try/except toàn bộ thân hàm, validate kiểu dữ liệu (location,
        max_budget, room_type) trước khi xử lý, không để lỗi rò ra ngoài.
    """
    try:
        if not isinstance(location, str) or not location.strip():
            return "LỖI: Tham số location không hợp lệ (phải là chuỗi không rỗng)."

        try:
            budget_value = float(str(max_budget).replace(",", "").strip())
        except (ValueError, TypeError):
            return "LỖI: max_budget phải là số dương (ví dụ: 5000000)."
        if budget_value <= 0:
            return "LỖI: max_budget phải là số dương (ví dụ: 5000000)."

        valid_types = ["phòng trọ", "chung cư mini", "căn hộ dịch vụ", "bất kỳ"]
        room_type_norm = (room_type or "bất kỳ").strip().lower()
        if room_type_norm not in valid_types:
            return ("LỖI: room_type không hợp lệ. Chỉ chấp nhận: "
                     "phòng trọ / chung cư mini / căn hộ dịch vụ / bất kỳ.")

        loc_lower = location.strip().lower()
        matches = []
        for item in LISTINGS_DB:
            if loc_lower not in item["location"].lower():
                continue
            if item["price"] > budget_value:
                continue
            if room_type_norm != "bất kỳ" and item["type"] != room_type_norm:
                continue
            matches.append(item)

        if not matches:
            return "LỖI: Không tìm thấy phòng phù hợp với khu vực/ngân sách/loại phòng đã cho."

        lines = [f"Tìm thấy {len(matches)} phòng phù hợp:"]
        for m in matches:
            lines.append(
                f"- [{m['id']}] {m['location']} | {m['type']} | {m['area']} | "
                f"{m['price']:,} VNĐ/tháng"
            )
        return "\n".join(lines)

    except Exception as e:
        return f"LỖI: Đã có sự cố khi tìm phòng ({str(e)})."


def book_viewing(listing_id: str, preferred_date: str, preferred_time: str) -> str:
    """
    Name: book_viewing

    Purpose:
        Đặt lịch hẹn xem một phòng trọ/căn hộ cụ thể. CHỈ dùng sau khi đã có
        listing_id hợp lệ từ kết quả search_rentals — không được tự bịa
        listing_id.

    Input schema:
        listing_id (str, required): Mã phòng lấy từ kết quả search_rentals,
            ví dụ 'RT001'.
        preferred_date (str, required): Ngày hẹn xem, định dạng 'DD/MM/YYYY'.
        preferred_time (str, required): Giờ hẹn xem, định dạng 'HH:MM' (24h).

    Output schema:
        str: Xác nhận lịch hẹn kèm mã booking, dạng:
             "Đặt lịch thành công! Mã booking: BK001. Xem phòng [RT001] tại
              {location} vào {date} lúc {time}."

    Error semantics:
        - listing_id / preferred_date / preferred_time rỗng hoặc không phải
          string -> "LỖI: Cả 3 tham số listing_id, preferred_date,
          preferred_time đều bắt buộc và phải là chuỗi không rỗng."
        - listing_id không tồn tại trong LISTINGS_DB -> "LỖI: Không tìm thấy
          phòng với mã '{listing_id}'. Vui lòng tìm phòng bằng search_rentals
          trước."
        - preferred_date sai định dạng DD/MM/YYYY -> "LỖI: preferred_date
          phải đúng định dạng DD/MM/YYYY."
        - preferred_time sai định dạng HH:MM -> "LỖI: preferred_time phải
          đúng định dạng HH:MM (24 giờ)."
        - Không bao giờ raise Exception ra ngoài.

    Side effect:
        ⚠️ CÓ SIDE EFFECT — khác với search_rentals. Hàm này APPEND một bản
        ghi mới vào BOOKINGS (bộ nhớ tạm, in-memory). Đây là hành động thay
        đổi trạng thái thật, không phải chỉ tra cứu. Vì vậy Agent chỉ được
        gọi tool này khi đã chắc chắn có listing_id hợp lệ và người dùng
        thực sự muốn đặt lịch (không đặt lịch "thử" hoặc suy đoán).

    Example:
        >>> book_viewing("RT001", "20/08/2026", "15:00")
        "Đặt lịch thành công! Mã booking: BK001. Xem phòng [RT001] tại
         Cầu Giấy, Hà Nội vào 20/08/2026 lúc 15:00."
        >>> book_viewing("RT999", "20/08/2026", "15:00")
        "LỖI: Không tìm thấy phòng với mã 'RT999'. Vui lòng tìm phòng bằng
         search_rentals trước."

    Safety:
        Có bọc try/except toàn bộ thân hàm, validate kiểu + định dạng ngày/
        giờ bằng regex trước khi ghi vào BOOKINGS, không để lỗi rò ra ngoài.
    """
    import re

    try:
        if (not isinstance(listing_id, str) or not listing_id.strip()
                or not isinstance(preferred_date, str) or not preferred_date.strip()
                or not isinstance(preferred_time, str) or not preferred_time.strip()):
            return ("LỖI: Cả 3 tham số listing_id, preferred_date, preferred_time "
                     "đều bắt buộc và phải là chuỗi không rỗng.")

        listing_id = listing_id.strip()
        preferred_date = preferred_date.strip()
        preferred_time = preferred_time.strip()

        if not re.match(r"^\d{2}/\d{2}/\d{4}$", preferred_date):
            return "LỖI: preferred_date phải đúng định dạng DD/MM/YYYY."

        if not re.match(r"^([01]\d|2[0-3]):[0-5]\d$", preferred_time):
            return "LỖI: preferred_time phải đúng định dạng HH:MM (24 giờ)."

        listing = next((item for item in LISTINGS_DB if item["id"] == listing_id), None)
        if listing is None:
            return (f"LỖI: Không tìm thấy phòng với mã '{listing_id}'. "
                     f"Vui lòng tìm phòng bằng search_rentals trước.")

        booking_id = f"BK{len(BOOKINGS) + 1:03d}"
        BOOKINGS.append({
            "booking_id": booking_id,
            "listing_id": listing_id,
            "date": preferred_date,
            "time": preferred_time,
        })

        return (f"Đặt lịch thành công! Mã booking: {booking_id}. "
                f"Xem phòng [{listing_id}] tại {listing['location']} "
                f"vào {preferred_date} lúc {preferred_time}.")

    except Exception as e:
        return f"LỖI: Đã có sự cố khi đặt lịch xem phòng ({str(e)})."


# ============================================================
# ĐĂNG KÝ TOOL — Role 4 (Core Agent) dùng dictionary này để tra tên tool
# do LLM sinh ra ra hàm Python thực thi tương ứng.
# ============================================================
AVAILABLE_TOOLS = {
    "search_rentals": search_rentals,
    "book_viewing": book_viewing,
}


# ============================================================
# SELF-TEST — chạy độc lập file này để kiểm tra tool không crash với input sai
# ============================================================
if __name__ == "__main__":
    print("=== SELF-TEST: search_rentals ===")
    test_cases_search = [
        ("Cầu Giấy, Hà Nội", "5000000", "phòng trọ"),
        ("Quận 7, TP.HCM", 7000000, "bất kỳ"),
        ("Đà Lạt", "3000000", "bất kỳ"),   # không có kết quả
        ("", "5000000", "bất kỳ"),          # location rỗng
        ("Hà Nội", "abc", "bất kỳ"),        # budget sai kiểu
        ("Hà Nội", "5000000", "villa"),     # room_type không hợp lệ
        (None, None, None),
    ]
    for loc, budget, rtype in test_cases_search:
        try:
            result = search_rentals(loc, budget, rtype)
            print(f"  Input: {(loc, budget, rtype)!r}\n    -> {result}\n")
        except Exception as e:
            print(f"  ❌ CRASH với input {(loc, budget, rtype)!r}: {e}")

    print("=== SELF-TEST: book_viewing ===")
    test_cases_book = [
        ("RT001", "20/08/2026", "15:00"),   # hợp lệ
        ("RT999", "20/08/2026", "15:00"),   # listing không tồn tại
        ("RT001", "2026-08-20", "15:00"),   # sai định dạng ngày
        ("RT001", "20/08/2026", "9:00"),    # sai định dạng giờ
        ("", "20/08/2026", "15:00"),        # thiếu listing_id
        (None, None, None),
    ]
    for lid, date, time in test_cases_book:
        try:
            result = book_viewing(lid, date, time)
            print(f"  Input: {(lid, date, time)!r}\n    -> {result}\n")
        except Exception as e:
            print(f"  ❌ CRASH với input {(lid, date, time)!r}: {e}")

    print("=== Danh sách tool đã đăng ký ===")
    for name in AVAILABLE_TOOLS:
        print(f"  ✅ {name}")

    print(f"\n📒 Số lịch hẹn đã đặt thành công trong self-test: {len(BOOKINGS)}")
    print("🎉 Hoàn thành self-test: không có tool nào crash!")