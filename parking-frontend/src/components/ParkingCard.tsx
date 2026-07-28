import React from 'react';
import './ParkingCard.css';

export interface ParkingSpot {
  id: string;
  title: string;
  price: string;
  published: string;
  acreage: string;
  address: string;
  image: string;
}

interface ParkingCardProps {
  spot: ParkingSpot;
  onClick?: () => void;
}

const ParkingCard: React.FC<ParkingCardProps> = ({ spot, onClick }) => {
  return (
    <div className="parking-card" onClick={onClick}>
      <div className="parking-card-image-wrapper">
        <img src={spot.image} alt={spot.title} className="parking-card-image" />
        <div className="favorite-btn">
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', fill: 'rgba(0, 0, 0, 0.5)', height: '24px', width: '24px', stroke: '#fff', strokeWidth: 2, overflow: 'visible' }}><path d="m16 28c7-4.733 14-10 14-17 0-1.792-.683-3.583-2.05-4.95-1.367-1.366-3.158-2.05-4.95-2.05-1.791 0-3.583.684-4.949 2.05l-2.051 2.051-2.05-2.051c-1.367-1.366-3.158-2.05-4.95-2.05-1.791 0-3.583.684-4.949 2.05-1.367 1.367-2.051 3.158-2.051 4.95 0 7 7 12.267 14 17z"></path></svg>
        </div>
      </div>
      <div className="parking-card-info">
        <div className="parking-card-header">
          <h3 className="parking-card-title" title={spot.title}>{spot.title}</h3>
          <span className="parking-card-rating">★ 4.8</span>
        </div>
        <p className="parking-card-address">{spot.address}</p>
        <p className="parking-card-details">{spot.acreage} m² • Cập nhật: {spot.published}</p>
        <p className="parking-card-price">
          <span className="price-value">{spot.price} triệu</span> <span className="price-unit">/ tháng</span>
        </p>
      </div>
    </div>
  );
};

export default ParkingCard;
