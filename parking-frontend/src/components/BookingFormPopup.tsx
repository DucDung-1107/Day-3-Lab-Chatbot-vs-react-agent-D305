import React, { useState } from 'react';
import type { ParkingSpot } from './ParkingCard';
import './Popups.css';

interface BookingFormPopupProps {
  spot: ParkingSpot;
  onClose: () => void;
  onSuccess: () => void;
}

const BookingFormPopup: React.FC<BookingFormPopupProps> = ({ spot, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      alert('Số điện thoại phải có đúng 10 chữ số!');
      return;
    }
    
    const selectedDate = new Date(time);
    if (selectedDate <= new Date()) {
      alert('Thời gian đặt lịch phải ở trong tương lai!');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch('http://localhost:3001/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotId: spot.id, name, phone, time })
      });
      const data = await res.json();
      
      if (data.success) {
        alert(data.message); // "Đặt lịch thành công, chờ chủ trọ xác nhận"
        onSuccess();
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi khi đặt lịch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="popup-overlay glass" onClick={onClose}>
      <div className="popup-content booking-popup" onClick={e => e.stopPropagation()}>
        <button className="popup-close-btn" onClick={onClose}>✕</button>
        <h2 className="popup-title">Đặt lịch hẹn xem trọ</h2>
        <div className="booking-spot-summary">
          <strong>{spot.title}</strong>
          <p>{spot.price} triệu/tháng</p>
        </div>
        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Họ và tên</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A" />
          </div>
          <div className="form-group">
            <label>Số điện thoại</label>
            <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901234567" />
          </div>
          <div className="form-group">
            <label>Thời gian xem phòng</label>
            <input required type="datetime-local" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <button type="submit" className="submit-booking-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingFormPopup;
