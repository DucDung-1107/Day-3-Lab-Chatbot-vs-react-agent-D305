import React, { useState, useEffect } from 'react';
import ParkingList from './components/ParkingList';
import Chatbot from './components/Chatbot';
import TopResultsPopup from './components/TopResultsPopup';
import DetailPopup from './components/DetailPopup';
import BookingFormPopup from './components/BookingFormPopup';
import History from './History';
import type { ParkingSpot } from './components/ParkingCard';
import './App.css';

const App: React.FC = () => {
  const [parkings, setParkings] = useState<ParkingSpot[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'history'>('home');
  
  // Popup States
  const [topResults, setTopResults] = useState<ParkingSpot[] | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [bookingSpot, setBookingSpot] = useState<ParkingSpot | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/parkings')
      .then(res => res.json())
      .then(data => setParkings(data))
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  const handleChatbotResults = (results: ParkingSpot[]) => {
    setTopResults(results);
  };

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-container container">
          <h1 className="logo" onClick={() => setActiveTab('home')}>RoomFinder</h1>
          <div className="nav-links">
            <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>Trang chủ</button>
            <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>Lịch sử</button>
          </div>
        </div>
      </nav>

      <main className="container main-content">
        {activeTab === 'home' ? (
          <>
            <Chatbot onResults={handleChatbotResults} />
            <div className="section-header">
              <h2>Khám phá phòng trọ & nhà nguyên căn</h2>
            </div>
            <ParkingList parkings={parkings} onSelectSpot={setSelectedSpot} />
          </>
        ) : (
          <History />
        )}
      </main>

      {/* Popups */}
      {topResults && (
        <TopResultsPopup 
          results={topResults} 
          onClose={() => setTopResults(null)} 
          onSelectSpot={(spot) => {
            setTopResults(null);
            setSelectedSpot(spot);
          }} 
        />
      )}

      {selectedSpot && (
        <DetailPopup 
          spot={selectedSpot} 
          onClose={() => setSelectedSpot(null)} 
          onBook={(spot) => setBookingSpot(spot)} 
        />
      )}

      {bookingSpot && (
        <BookingFormPopup 
          spot={bookingSpot} 
          onClose={() => setBookingSpot(null)} 
          onSuccess={() => setActiveTab('history')} 
        />
      )}
    </div>
  );
};

export default App;
