from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import pandas as pd
import os
import json
from agent import run_react_agent_stream

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load CSV
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
csv_path = os.path.join(base_dir, "dn.csv")
df = pd.read_csv(csv_path)

parking_data = []
for index, row in df.head(50).iterrows():
    parking_data.append({
        "id": str(index + 1),
        "title": str(row['title']),
        "price": str(row['price']) + " triệu",
        "published": str(row['published']),
        "acreage": str(row['acreage']) + " m2",
        "address": str(row['address']),
        "image": ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&auto=format&fit=crop&q=60", 
                  "https://images.unsplash.com/photo-1502672260266-1c1c2c441539?w=500&auto=format&fit=crop&q=60",
                  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&auto=format&fit=crop&q=60",
                  "https://plus.unsplash.com/premium_photo-1661962841993-99a07c27bf88?w=500&auto=format&fit=crop&q=60"][index % 4]
    })

class ChatRequest(BaseModel):
    query: str
    history: list = []  # Multi-turn conversation history

class BookRequest(BaseModel):
    spotId: str
    name: str
    phone: str
    time: str

booking_history = [
    {
        "id": "mock-1",
        "spot": parking_data[0] if len(parking_data) > 0 else None,
        "name": "Nguyễn Văn A",
        "phone": "0912345678",
        "time": "2023-11-20T14:00",
        "status": "Thành công"
    },
    {
        "id": "mock-2",
        "spot": parking_data[1] if len(parking_data) > 1 else None,
        "name": "Trần Thị B",
        "phone": "0987654321",
        "time": "2026-08-15T09:00",
        "status": "Chờ xác nhận"
    }
]

@app.get("/api/parkings")
def get_parkings():
    return parking_data

@app.post("/api/chat")
def chat(request: ChatRequest):
    # Run the ReAct agent with streaming and conversation history
    return StreamingResponse(run_react_agent_stream(request.query, request.history), media_type="text/event-stream")

@app.post("/api/book")
def book(request: BookRequest):
    # Mocking booking success logic as requested by frontend
    spot = next((p for p in parking_data if p["id"] == request.spotId), None)
    new_booking = {
        "id": str(len(booking_history) + 1),
        "spot": spot,
        "name": request.name,
        "phone": request.phone,
        "time": request.time,
        "status": "Chờ xác nhận"
    }
    booking_history.append(new_booking)
    return {"success": True, "message": "Đặt lịch thành công, chờ chủ trọ xác nhận", "booking": new_booking}

@app.get("/api/history")
def history():
    return booking_history

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
