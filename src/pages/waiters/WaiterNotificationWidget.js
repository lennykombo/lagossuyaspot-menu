import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../components/firebase'; // Adjust path
import { BellRing, X } from 'lucide-react';

const WaiterNotificationWidget = () => {
  const [readyOrders, setReadyOrders] = useState([]);
  const [waiterId, setWaiterId] = useState(null);
  
  // Audio Ref
  const audioRef = useRef(null);

  // 1. Get Current Waiter ID
  useEffect(() => {
    const w = localStorage.getItem('currentWaiter');
    if (w) {
      const parsed = JSON.parse(w);
      setWaiterId(parsed.id);
    }
  }, []);

  // 2. Initialize Audio
  useEffect(() => {
    // You can use a different sound for waiters (e.g., a "ding")
    audioRef.current = new Audio("/winner-bell.mp3"); // Make sure this file exists in public/
    audioRef.current.loop = true; // Loop until they acknowledge
  }, []);

  // 3. Listen for READY orders for THIS waiter
  useEffect(() => {
    if (!waiterId) return;

    // QUERY: Status is 'ready' AND waiterId matches logged in user
    const q = query(
      collection(db, "inhouseorders"), 
      where("status", "==", "ready"),
      where("waiterId", "==", waiterId) 
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReadyOrders(orders);

      // --- SOUND LOGIC ---
      if (orders.length > 0) {
        // Play sound if not already playing
        if (audioRef.current && audioRef.current.paused) {
          audioRef.current.play().catch(e => console.log("Audio interaction needed:", e));
        }
      } else {
        // Stop sound if no orders are ready
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
    });

    return () => {
      unsubscribe();
      if (audioRef.current) audioRef.current.pause();
    };
  }, [waiterId]);

  // Stop sound manually (Acknowledge)
  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  if (readyOrders.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom duration-500">
      <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-2xl border-4 border-white max-w-sm relative">
        
        {/* Close/Stop Button */}
        <button 
            onClick={stopSound}
            className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
        >
            <X size={16} />
        </button>

        <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-xl animate-bounce">
                <BellRing size={28} className="text-white" />
            </div>
            
            <div>
                <h3 className="font-black text-lg leading-none mb-1">ORDER READY!</h3>
                <p className="text-blue-100 text-xs font-bold mb-2">Kitchen is waiting for you.</p>
                
                {/* List Tables */}
                <div className="flex flex-wrap gap-2">
                    {readyOrders.map(order => (
                        <span key={order.id} className="bg-white text-blue-700 px-2 py-1 rounded-md text-xs font-black uppercase">
                            Table {order.tableName}
                        </span>
                    ))}
                </div>
            </div>
        </div>

        {/* Action Hint */}
        <div className="mt-3 pt-2 border-t border-blue-400/50 text-center">
             <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Go to table to serve</p>
        </div>
      </div>
    </div>
  );
};

export default WaiterNotificationWidget;