import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    { id: '1', title: 'Tim phong tro Da Nang', messages: [], history: [] }
  ]);
  const [activeThreadId, setActiveThreadId] = useState<string>('1');
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<BookingData | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use refs to avoid stale closures in async stream handler
  const activeThreadIdRef = useRef(activeThreadId);
  useEffect(() => { activeThreadIdRef.current = activeThreadId; }, [activeThreadId]);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
  // Capture history in a ref so async handler has fresh value
  const historyRef = useRef(activeThread.history);
  useEffect(() => { historyRef.current = activeThread.history; }, [activeThread.history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread.messages]);

  const createNewThread = () => {
    const newId = Date.now().toString();
    setThreads(prev => [{ id: newId, title: 'Doan chat moi', messages: [], history: [] }, ...prev]);
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

  const handleSearch = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;

    const tid = activeThreadIdRef.current;
    const currentHistory = historyRef.current;

    // Set thread title on first message
    setThreads(prev => prev.map(t =>
      t.id === tid && t.messages.length === 0
        ? { ...t, title: text.substring(0, 22) }
        : t
    ));

    const userMsgId = `u-${Date.now()}`;
    const thoughtId  = `th-${Date.now()}`;

    setThreads(prev => prev.map(t =>
      t.id === tid
        ? { ...t, messages: [...t.messages,
            { id: userMsgId, role: 'user', text },
            { id: thoughtId, role: 'agent', text: 'Dang suy nghi...', isThought: true }
          ]}
        : t
    ));

    setQuery('');
    setIsThinking(true);

    // Helper: update only the thought bubble (uses ref-captured tid & thoughtId)
    const updateThought = (newText: string) => {
      setThreads(prev => prev.map(t => {
        if (t.id !== tid) return t;
        return { ...t, messages: t.messages.map(m =>
          m.id === thoughtId ? { ...m, text: m.text === 'Dang suy nghi...' ? newText : m.text + '\n' + newText } : m
        )};
      }));
    };

    const resolveThought = (finalText: string, results: ParkingSpot[]) => {
      setThreads(prev => prev.map(t => {
        if (t.id !== tid) return t;
        return {
          ...t,
          messages: t.messages.map(m =>
            m.id === thoughtId
              ? { ...m, text: finalText, isThought: false, results }
              : m
          ),
          history: [...t.history,
            { role: 'user', content: text },
            { role: 'assistant', content: finalText }
          ]
        };
      }));
    };

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, history: currentHistory }),
      });

      if (!res.body) throw new Error('No body');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let done   = false;
      let gotResult = false;

      while (!done) {
        const { value, done: rd } = await reader.read();
        done = rd;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() || '';

          for (const chunk of chunks) {
            if (!chunk.startsWith('data: ')) continue;
            let data: any;
            try { data = JSON.parse(chunk.slice(6)); } catch { continue; }

            if (data.type === 'thought') {
              updateThought(`[${data.content}]`);
            } else if (data.type === 'result') {
              gotResult = true;
              const results: ParkingSpot[] = data.results || [];
              resolveThought(data.message, results);

              // Trigger top-3 popup if there are results
              if (results.length > 0) {
                onResults(results);
              }

              if (data.booking_ready && data.booking_data) {
                setPendingBooking(data.booking_data);
              }
            }
          }
        }
      }

      if (!gotResult) {
        resolveThought('Khong nhan duoc ket qua. Vui long thu lai.', []);
      }
    } catch (e) {
      console.error(e);
      resolveThought('Loi ket noi den Agent. Vui long thu lai.', []);
    } finally {
      setIsThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isThinking, onResults]);

  const handleConfirmBooking = async () => {
    if (!pendingBooking) return;
    setIsBooking(true);
    try {
      const res = await fetch('http://localhost:3001/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotId: pendingBooking.apartment_id,
          name: pendingBooking.name,
          phone: pendingBooking.phone,
          time: pendingBooking.time,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const tid = activeThreadIdRef.current;
        setThreads(prev => prev.map(t =>
          t.id === tid
            ? { ...t, messages: [...t.messages, {
                id: `c-${Date.now()}`, role: 'agent' as const,
                text: `Dat lich thanh cong! Lich hen xem phong "${pendingBooking.title}" vao ${pendingBooking.time}. Chu tro se lien he qua SDT ${pendingBooking.phone}.`
              }]}
            : t
        ));
        setPendingBooking(null);
      }
    } catch {
      alert('Loi khi dat lich, vui long thu lai.');
    } finally {
      setIsBooking(false);
    }
  };

  const isInChatMode = activeThread.messages.length > 0;

  return (
    <div className={`cb-layout ${isInChatMode ? 'cb-chat-mode' : ''}`}>

      {/* Sidebar */}
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

      {/* Main */}
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
                  {/* Inline mini cards only - popup handled by onResults */}
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
            placeholder="Hoi ve phong tro, gia ca, lich xem nha..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
            disabled={isThinking}
          />
          <button className="cb-send-btn" onClick={() => handleSearch(query)} disabled={isThinking || !query.trim()}>
            {isThinking ? <span className="cb-dots">...</span> : <span>&#9658;</span>}
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
