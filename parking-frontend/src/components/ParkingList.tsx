import React from 'react';
import type { ParkingSpot } from './ParkingCard';
import ParkingCard from './ParkingCard';
import './ParkingList.css';

interface ParkingListProps {
  parkings: ParkingSpot[];
  onSelectSpot: (spot: ParkingSpot) => void;
}

const ParkingList: React.FC<ParkingListProps> = ({ parkings, onSelectSpot }) => {
  if (parkings.length === 0) {
    return <div className="parking-list-empty">Đang tải danh sách bãi đỗ xe...</div>;
  }

  return (
    <div className="parking-list">
      {parkings.map((spot) => (
        <ParkingCard key={spot.id} spot={spot} onClick={() => onSelectSpot(spot)} />
      ))}
    </div>
  );
};

export default ParkingList;
