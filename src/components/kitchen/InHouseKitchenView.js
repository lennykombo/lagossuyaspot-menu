import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../components/firebase'; // <--- CHECK THIS PATH (It might be ../firebase depending on your folder)
import { Utensils, Clock } from 'lucide-react';

const InHouseKitchenView = ({ onStatusChange }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to inhouseorders
    const q = query(collection(db, "inhouseorders"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter out completed/cancelled
      const activeOrders = data.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
      
      setOrders(activeOrders);
      setLoading(false);

      // Notify parent for Sound Logic
      const hasNew = activeOrders.some(o => o.status === 'paid' || o.status === 'pending');
      if (onStatusChange) {
        onStatusChange(hasNew);
      }
    });

    return () => unsubscribe();
  }, [onStatusChange]);

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "inhouseorders", id), { status: newStatus });
    } catch (error) { console.error(error); }
  };

  // --- NEW: Helper to display Extras, Spices, and Notes ---
  const renderItemModifiers = (item) => {
    // Check both naming conventions (POS vs Online)
    const spice = item.selectedSpice || item.spiceLevel;
    const extras = item.selectedExtras || item.extras || [];
    const note = item.note || item.notes;

    if (!spice && extras.length === 0 && !note) return null;

    return (
      <div className="flex flex-col gap-1 mt-1 ml-1 pl-4 border-l-2 border-gray-100">
        {/* Spice */}
        {spice && (
          <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-black border border-red-100 w-fit">
            🔥 {spice}
          </span>
        )}
        {/* Extras */}
        {extras.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {extras.map((e, i) => (
              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 font-bold uppercase">
                + {e.label || e.name}
              </span>
            ))}
          </div>
        )}
        {/* Note */}
        {note && (
          <div className="text-[10px] text-blue-600 italic">
            "{note}"
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-4 text-blue-400 font-bold">Loading...</div>;

  return (
    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-3xl h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-blue-200 pb-4 shrink-0">
        <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
          <Utensils size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-blue-900 uppercase">Dining Room</h2>
          <p className="text-sm text-blue-400 font-bold">{orders.length} Active Tables</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-2">
        {orders.length === 0 && <div className="text-center py-10 text-blue-300 font-bold">No active tables</div>}
        
        {orders.map((order) => {
          // Check specific states
          const isNew = order.status === 'paid' || order.status === 'pending';
          const isServed = order.status === 'served';
          const isReady = order.status === 'ready';

          // Determine Badge Color
          let badgeColor = "bg-blue-500 text-white";
          if (isNew) badgeColor = "bg-red-500 text-white animate-pulse";
          if (isReady) badgeColor = "bg-green-500 text-white";
          if (isServed) badgeColor = "bg-gray-700 text-white";

          return (
            <div key={order.id} className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden flex flex-col ${isNew ? 'border-red-400 ring-4 ring-red-100' : 'border-blue-100'}`}>
              
              {/* Card Top */}
              <div className="bg-blue-50 p-3 flex justify-between items-center border-b border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-black border-2 border-blue-200 shadow-sm text-lg">
                    {order.tableName}
                  </div>
                  <div className="leading-none">
                    <span className="text-[10px] text-blue-400 font-bold uppercase">Table</span>
                    <span className="font-bold text-blue-900 text-xs uppercase block mt-0.5">{order.waiterName || "Server"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${badgeColor}`}>
                      {isNew ? 'NEW TICKET' : order.status}
                  </span>
                  <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-end gap-1">
                    <Clock size={10}/> 
                    {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                  </div>
                </div>
              </div>

              {/* Card Items */}
              <div className="p-3 flex-1">
                 {order.items?.map((item, idx) => (
                    <div key={idx} className="border-b border-dashed border-gray-100 last:border-0 pb-3 last:pb-0 mb-2">
                        <div className="flex gap-2 items-start">
                            <div className="font-black text-gray-800 text-lg">{item.qty}</div>
                            <div className="text-sm text-gray-700 font-bold mt-0.5">{item.name}</div>
                        </div>
                        {renderItemModifiers(item)}
                    </div>
                 ))}
              </div>

              {/* Card Actions - FIXED LOGIC HERE */}
              <div className="p-3 bg-gray-50 border-t">
                 {isNew ? (
                    <button onClick={() => updateStatus(order.id, 'preparing')} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm uppercase hover:bg-green-700 shadow-sm">Start Cooking</button>
                 ) : (
                    <div className="flex gap-2">
                      
                      {/* ONLY SHOW READY BUTTON IF IT IS PREPARING */}
                      {order.status === 'preparing' && (
                        <button onClick={() => updateStatus(order.id, 'ready')} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-[10px] uppercase hover:bg-blue-700">
                          Mark Ready
                        </button>
                      )}

                      {/* IF SERVED, SHOW VISUAL CONFIRMATION INSTEAD OF BUTTON */}
                      {isServed && (
                        <div className="flex-1 flex items-center justify-center bg-gray-200 text-gray-600 rounded-lg font-bold text-[10px] uppercase border border-gray-300">
                          Served
                        </div>
                      )}
                      
                      {/* ARCHIVE BUTTON ALWAYS AVAILABLE FOR NON-NEW ITEMS */}
                      <button onClick={() => updateStatus(order.id, 'completed')} className="flex-1 bg-white border border-gray-300 text-gray-600 py-2 rounded-lg font-bold text-[10px] uppercase hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                        Archive
                      </button>
                    </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InHouseKitchenView;













/*import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Utensils } from 'lucide-react';

const InHouseKitchenView = ({ playSound }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH ONLY IN-HOUSE ORDERS ---
  useEffect(() => {
    const q = query(collection(db, "inhouseorders"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter out completed/archived
      const activeOrders = data.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
      
      setOrders(activeOrders);
      setLoading(false);

      // Trigger Sound if new ticket arrives
      const hasNew = activeOrders.some(o => o.status === 'paid' || o.status === 'pending');
      if (hasNew && playSound) playSound();
    });

    return () => unsubscribe();
  }, [playSound]);

  // --- 2. UPDATE STATUS ---
  const updateStatus = async (id, newStatus) => {
    try {
      // Updates specific inhouseorders collection
      await updateDoc(doc(db, "inhouseorders", id), { status: newStatus });
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  if (loading) return <div className="p-4 text-blue-400 font-bold">Loading Tables...</div>;

  return (
    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-3xl min-h-[80vh]">
      
      {/* SECTION HEADER *//*
      <div className="flex items-center gap-3 mb-6 border-b border-blue-200 pb-4">
        <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200">
          <Utensils size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-blue-900 uppercase">Dining Room</h2>
          <p className="text-sm text-blue-400 font-bold">{orders.length} Active Tables</p>
        </div>
      </div>

      {/* ORDERS LIST *//*
      <div className="space-y-4">
        {orders.length === 0 && (
          <div className="text-center py-20 text-blue-300 font-bold italic">
            No active table orders.
          </div>
        )}

        {orders.map((order) => (
          <div 
            key={order.id} 
            className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 flex flex-col transition-all
              ${order.status === 'paid' || order.status === 'pending' ? 'border-red-400 ring-4 ring-red-100' : 'border-blue-100'}
            `}
          >
            
            {/* --- ROUND BADGE HEADER --- *//*
            <div className="bg-blue-50 p-3 flex justify-between items-center border-b border-blue-100">
              <div className="flex items-center gap-3">
                {/* The Round Badge *//*
                <div className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center font-black border-2 border-blue-200 shadow-sm text-xl">
                  {order.tableName}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Table</span>
                  <span className="font-black text-blue-900 text-sm uppercase tracking-wide">In-House</span>
                </div>
              </div>

              {/* Status Pill *//*
              <div className="text-right">
                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                    order.status === 'paid' || order.status === 'pending' ? 'bg-red-500 text-white animate-pulse' :
                    order.status === 'preparing' ? 'bg-blue-500 text-white' :
                    'bg-green-500 text-white'
                 }`}>
                   {order.status === 'paid' || order.status === 'pending' ? 'NEW TICKET' : order.status}
                 </span>
                 <div className="text-[10px] text-gray-400 font-mono mt-1">#{order.id.slice(-4)}</div>
              </div>
            </div>

            {/* --- BODY --- *//*
            <div className="p-4 flex-1">
               <div className="text-xs font-bold text-gray-400 uppercase mb-3 flex justify-between">
                 <span>Server: {order.waiterName}</span>
                 <span>{new Date(order.createdAt?.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
               </div>

               <div className="space-y-2">
                 {order.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-3 border-b border-dashed border-gray-50 last:border-0 pb-2 last:pb-0">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center font-black text-gray-800 text-sm">
                          {item.qty}
                        </div>
                        <div className="flex-1">
                           <p className="font-bold text-gray-700 text-sm leading-tight">{item.name}</p>
                           {/* Modifiers *//*
                           <div className="flex flex-wrap gap-1 mt-1">
                              {item.selectedSpice && <span className="text-[10px] bg-red-50 text-red-600 px-1 rounded font-bold border border-red-100">🔥 {item.selectedSpice}</span>}
                              {item.selectedExtras?.map((e, i) => <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded font-bold border border-gray-200">+ {e.label || e.name}</span>)}
                           </div>
                           {item.note && <p className="text-xs text-blue-500 italic mt-1 bg-blue-50 p-1 rounded">"{item.note}"</p>}
                        </div>
                    </div>
                 ))}
               </div>
            </div>

            {/* --- FOOTER ACTIONS --- *//*
            <div className="p-3 bg-gray-50 border-t flex gap-2">
               {(order.status === 'paid' || order.status === 'pending') ? (
                  <button onClick={() => updateStatus(order.id, 'preparing')} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm uppercase shadow-sm hover:bg-green-700">
                    Start Cooking
                  </button>
               ) : (
                  <>
                    {order.status !== 'ready' && (
                      <button onClick={() => updateStatus(order.id, 'ready')} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-xs uppercase hover:bg-blue-700">
                        Mark Ready
                      </button>
                    )}
                    <button onClick={() => updateStatus(order.id, 'completed')} className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-2 rounded-lg font-bold text-xs uppercase hover:bg-gray-100">
                      Archive
                    </button>
                  </>
               )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default InHouseKitchenView;*/