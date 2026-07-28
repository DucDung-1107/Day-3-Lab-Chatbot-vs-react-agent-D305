from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
import json
from agent import run_react_agent

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
        "image": "https://images.unsplash.com/photo-1596276020587-804acffc87da?w=500&auto=format&fit=crop&q=60"
    })

class ChatRequest(BaseModel):
    query: str

class BookRequest(BaseModel):
    spotId: str
    name: str
    phone: str
    time: str

booking_history = []

@app.get("/api/parkings")
def get_parkings():
    return parking_data

@app.post("/api/chat")
def chat(request: ChatRequest):
    # Run the ReAct agent
    result = run_react_agent(request.query)
    return result

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
