import React, { useState } from 'react';
import type { ParkingSpot } from './ParkingCard';
import './Chatbot.css';

interface ChatbotProps {
  onResults: (results: ParkingSpot[]) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ onResults }) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const suggestions = [
    "Tìm nhà trọ gần Đại học Bách Khoa",
    "Phòng trọ giá dưới 2 triệu",
    "Nhà nguyên căn tại Cẩm Lệ",
    "Phòng trọ có máy lạnh"
  ];

  const handleSearch = async (text: string) => {
    setQuery(text);
    setStatus('Đang suy nghĩ...');
    
    setTimeout(() => setStatus('Đang tìm kiếm nhà trọ phù hợp...'), 1500);

    setTimeout(async () => {
      setStatus('Đã tìm thấy');
      try {
        const res = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text })
        });
        const data = await res.json();
        
        setTimeout(() => {
          setStatus(null);
          onResults(data.results);
        }, 1000);
      } catch (e) {
        console.error(e);
        setStatus('Lỗi kết nối');
      }
    }, 3000);
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h2>Trợ lý AI - Đặt phòng tự động</h2>
        <p>Hỏi bất cứ điều gì để tìm chỗ ở phù hợp nhất</p>
      </div>
      
      <div className="chatbot-input-wrapper">
        <input 
          type="text" 
          placeholder="Nhập yêu cầu của bạn (VD: Tìm phòng trọ gần trung tâm...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
        />
        <button className="chatbot-send-btn" onClick={() => handleSearch(query)}>
          Tìm kiếm
        </button>
      </div>

      {status && (
        <div className="chatbot-status">
          <div className="spinner"></div>
          <span>{status}</span>
        </div>
      )}

      {!status && (
        <div className="chatbot-suggestions">
          {suggestions.map((s, i) => (
            <div key={i} className="suggestion-card" onClick={() => handleSearch(s)}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Chatbot;
