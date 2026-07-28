import React from 'react';
import type { ParkingSpot } from './ParkingCard';
import ParkingCard from './ParkingCard';
import './Popups.css';

interface TopResultsPopupProps {
  results: ParkingSpot[];
  onClose: () => void;
  onSelectSpot: (spot: ParkingSpot) => void;
}

const TopResultsPopup: React.FC<TopResultsPopupProps> = ({ results, onClose, onSelectSpot }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="popup-overlay glass" onClick={onClose}>
      <div className="popup-content top-results-popup" onClick={e => e.stopPropagation()}>
        <button className="popup-close-btn" onClick={onClose}>✕</button>
        <h2 className="popup-title">Top 3 Nhà Trọ Phù Hợp Nhất</h2>
        <div className="top-results-grid">
          {results.map(spot => (
            <ParkingCard key={spot.id} spot={spot} onClick={() => onSelectSpot(spot)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopResultsPopup;
