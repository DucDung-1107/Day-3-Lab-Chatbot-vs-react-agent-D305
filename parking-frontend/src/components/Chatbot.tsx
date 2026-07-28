import React, { useState, useRef, useEffect } from 'react';
import ParkingCard from './ParkingCard';
import type { ParkingSpot } from './ParkingCard';
import './Chatbot.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  isThought?: boolean;
  results?: ParkingSpot[];
}

interface BookingData {
  apartment_id: string;
  name: string;
  phone: string;
  time: string;
  title: string;
  address: string;
  price: string;
}

interface Thread {
  id: string;
  title: string;
  messages: ChatMessage[];
  history: { role: string; content: string }[];
}

interface ChatbotProps {
  onResults: (results: ParkingSpot[]) => void;
  onSelectSpot?: (spot: ParkingSpot) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ onResults, onSelectSpot }) => {
  const [threads, setThreads] = useState<Thread[]>([
    { id: '1', title: 'Tìm phòng trọ Đà Nẵng', messages: [], history: [] }
  ]);
  const [activeThreadId, setActiveThreadId] = useState<string>('1');
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<BookingData | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  const updateThread = (updater: (t: Thread) => Thread) => {
    setThreads(prev => prev.map(t => t.id === activeThreadId ? updater(t) : t));
  };

  const createNewThread = () => {
    const newId = Date.now().toString();
    setThreads(prev => [{ id: newId, title: 'Đoạn chat mới', messages: [], history: [] }, ...prev]);
    setActiveThreadId(newId);
    setPendingBooking(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const suggestions = [
    'Tim nha tro gan Dai hoc Bach Khoa',
    'Phong tro gia duoi 2 trieu',
    'Dat lich xem phong tai Cam Le',
    'Phong tro co dieu hoa',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread.messages]);

  const handleSearch = async (text: string) => {
    if (!text.trim() || isThinking) return;

    if (activeThread.messages.length === 0) {
      const truncated = text.replace(/[🏘️💰📅❄️]/g, '').trim().substring(0, 24);
      updateThread(t => ({ ...t, title: truncated + (truncated.length >= 24 ? '…' : '') }));
    }

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text };
    const thoughtId = `t-${Date.now()}`;

    updateThread(t => ({
      ...t,
      messages: [...t.messages, userMsg, { id: thoughtId, role: 'agent', text: '💭 Đang phân tích yêu cầu…', isThought: true }],
    }));
    setQuery('');
    setIsThinking(true);

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, history: activeThread.history }),
      });

      if (!res.body) throw new Error('No body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() || '';

          for (const chunk of chunks) {
            if (!chunk.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(chunk.slice(6));
              if (data.type === 'thought') {
                setThreads(prev => prev.map(t => {
                  if (t.id !== activeThreadId) return t;
                  return { ...t, messages: t.messages.map(m => m.id === thoughtId ? { ...m, text: `💭 ${data.content}` } : m) };
                }));
              } else if (data.type === 'result') {
                setThreads(prev => prev.map(t => {
                  if (t.id !== activeThreadId) return t;
                  return {
                    ...t,
                    messages: t.messages.map(m => m.id === thoughtId
                      ? { ...m, text: data.message, isThought: false, results: data.results || [] }
                      : m),
                    history: [...t.history, { role: 'user', content: text }, { role: 'assistant', content: data.message }],
                  };
                }));
                if (data.booking_ready && data.booking_data) {
                  setPendingBooking(data.booking_data);
                }
              }
            } catch (_) {}
          }
        }
      }
    } catch {
      setThreads(prev => prev.map(t => {
        if (t.id !== activeThreadId) return t;
        return { ...t, messages: t.messages.map(m => m.id === thoughtId ? { ...m, text: 'Loi ket noi. Vui long thu lai.', isThought: false } : m) };
      }));
    } finally {
      setIsThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleConfirmBooking = async () => {
    if (!pendingBooking) return;
    setIsBooking(true);
    try {
      const res = await fetch('http://localhost:3001/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotId: pendingBooking.apartment_id, name: pendingBooking.name, phone: pendingBooking.phone, time: pendingBooking.time }),
      });
      const data = await res.json();
      if (data.success) {
        const confirmMsg: ChatMessage = {
          id: `c-${Date.now()}`,
          role: 'agent',
          text: `Dat lich thanh cong! Lich hen xem phong "${pendingBooking.title}" vao ${pendingBooking.time} da duoc ghi nhan. Chu tro se lien he qua SDT ${pendingBooking.phone}.`,
        };
        updateThread(t => ({ ...t, messages: [...t.messages, confirmMsg] }));
        setPendingBooking(null);
      }
    } catch {
      alert('Lỗi khi đặt lịch, vui lòng thử lại.');
    } finally {
      setIsBooking(false);
    }
  };

  const isInChatMode = activeThread.messages.length > 0;

  return (
    <div className={`cb-layout ${isInChatMode ? 'cb-chat-mode' : ''}`}>

      {/* ── Sidebar ── */}
      <aside className="cb-sidebar">
        <div className="cb-sidebar-header">
          <span className="cb-brand">RoomAI</span>
        </div>
        <button className="cb-new-btn" onClick={createNewThread}>+ Doan chat moi</button>
        <nav className="cb-thread-nav">
          {threads.map(t => (
            <button
              key={t.id}
              className={`cb-thread-item ${t.id === activeThreadId ? 'cb-active' : ''}`}
              onClick={() => { setActiveThreadId(t.id); setPendingBooking(null); }}
            >
              <span className="cb-thread-title">{t.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main panel ── */}
      <div className="cb-main">

        {/* Empty state */}
        {!isInChatMode && (
          <div className="cb-empty">
            <h2 className="cb-empty-title">Tro ly AI Tim Phong Tro</h2>
            <p className="cb-empty-sub">Hoi bat ky dieu gi ve phong tro, gia ca hoac dat lich xem nha tai Da Nang</p>
          </div>
        )}

        {/* Messages */}
        {isInChatMode && (
          <div className="cb-messages">
            {activeThread.messages.map(msg => (
              <div key={msg.id} className={`cb-row cb-row-${msg.role}`}>
                {msg.role === 'agent' && <div className="cb-avatar">AI</div>}
                <div className="cb-bubble-col">
                  <div className={`cb-bubble cb-bubble-${msg.role} ${msg.isThought ? 'cb-thought' : ''}`}>
                    {msg.text}
                  </div>
                  {!msg.isThought && msg.results && msg.results.length > 0 && (
                    <div className="cb-cards">
                      {msg.results.map(spot => (
                        <div key={spot.id} className="cb-card-wrap" onClick={() => onSelectSpot?.(spot)}>
                          <ParkingCard spot={spot} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* HITL Banner */}
        {pendingBooking && (
          <div className="cb-hitl">
            <div className="cb-hitl-info">
              <p className="cb-hitl-label">Xac nhan dat lich xem phong</p>
              <p className="cb-hitl-room">{pendingBooking.title}</p>
              <p className="cb-hitl-detail">{pendingBooking.time} · {pendingBooking.name} · {pendingBooking.phone}</p>
            </div>
            <div className="cb-hitl-btns">
              <button className="cb-hitl-ok" onClick={handleConfirmBooking} disabled={isBooking}>
                {isBooking ? 'Dang dat...' : 'Xac nhan dat lich'}
              </button>
              <button className="cb-hitl-no" onClick={() => setPendingBooking(null)}>Huy</button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="cb-input-row">
          <input
            ref={inputRef}
            className="cb-input"
            type="text"
            placeholder="Hỏi về phòng trọ, giá cả, lịch xem nhà…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
            disabled={isThinking}
          />
          <button className="cb-send-btn" onClick={() => handleSearch(query)} disabled={isThinking || !query.trim()}>
            {isThinking ? <span className="cb-dots">···</span> : <span>&#9658;</span>}
          </button>
        </div>

        {/* Suggestions */}
        {!isInChatMode && (
          <div className="cb-suggestions">
            {suggestions.map((s, i) => (
              <button key={i} className="cb-chip" onClick={() => handleSearch(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
