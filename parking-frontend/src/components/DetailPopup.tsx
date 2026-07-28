import React from 'react';
import type { ParkingSpot } from './ParkingCard';
import './Popups.css';

interface DetailPopupProps {
  spot: ParkingSpot;
  onClose: () => void;
  onBook: (spot: ParkingSpot) => void;
}

const DetailPopup: React.FC<DetailPopupProps> = ({ spot, onClose, onBook }) => {
  return (
    <div className="popup-overlay glass" onClick={onClose}>
      <div className="popup-content detail-popup" onClick={e => e.stopPropagation()}>
        <button className="popup-close-btn" onClick={onClose}>✕</button>
        <div className="detail-image-wrapper">
          <img src={spot.image} alt={spot.title} className="detail-image" />
        </div>
        <div className="detail-info">
          <h2>{spot.title}</h2>
          <p className="detail-address">{spot.address}</p>
          <div className="detail-meta">
            <span>{spot.acreage} m²</span>
            <span>•</span>
            <span>Cập nhật: {spot.published}</span>
          </div>
          <div className="detail-price-section">
            <div className="price-tag">
              <span className="price-value">{spot.price} triệu</span>
              <span className="price-unit">/ tháng</span>
            </div>
            <button className="book-btn" onClick={() => { onClose(); onBook(spot); }}>
              Đặt lịch ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPopup;
