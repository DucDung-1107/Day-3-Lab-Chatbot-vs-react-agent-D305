from agent import run_react_agent
import json

def test():
    print("TEST 1: Tìm nhà trọ gần Đại học Bách Khoa")
    res1 = run_react_agent("Tìm nhà trọ gần Đại học Bách Khoa")
    print(json.dumps(res1, indent=2, ensure_ascii=False))

    print("\n" + "="*50 + "\n")

    print("TEST 2: Đặt lịch xem phòng vào 27-7-2026 14:00")
    res2 = run_react_agent("Tôi muốn tìm phòng gần hai bà trưng và đặt lịch xem vào 14:00 ngày 27-7-2026")
    print(json.dumps(res2, indent=2, ensure_ascii=False))
    
    print("\n" + "="*50 + "\n")

    print("TEST 3: Đặt lịch xem phòng vào 1-8-2026 22:00")
    res3 = run_react_agent("Tôi muốn tìm phòng gần hai bà trưng và đặt lịch xem vào 22:00 ngày 1-8-2026")
    print(json.dumps(res3, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test()
