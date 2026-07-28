import React, { useEffect, useState } from 'react';
import type { ParkingSpot } from './components/ParkingCard';
import './History.css';

interface Booking {
  id: string;
  spot: ParkingSpot;
  name: string;
  phone: string;
  time: string;
  status: string;
}

const History: React.FC = () => {
  const [history, setHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/history');
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) return <div className="history-loading">Đang tải lịch sử...</div>;

  return (
    <div className="history-container">
      <h2 className="history-title">Lịch sử đặt lịch</h2>
      {history.length === 0 ? (
        <p className="history-empty">Chưa có lịch sử đặt lịch nào.</p>
      ) : (
        <div className="history-list">
          {history.map(booking => (
            <div key={booking.id} className="history-card glass">
              <div className="history-spot-image">
                <img src={booking.spot?.image} alt={booking.spot?.title} />
              </div>
              <div className="history-details">
                <h3>{booking.spot?.title}</h3>
                <p><strong>Thời gian xem:</strong> {new Date(booking.time).toLocaleString('vi-VN')}</p>
                <p><strong>Người đặt:</strong> {booking.name} - {booking.phone}</p>
                <p>
                  <strong>Trạng thái:</strong> 
                  <span className="status-badge">{booking.status}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
