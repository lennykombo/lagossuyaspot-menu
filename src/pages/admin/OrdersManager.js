import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../../components/firebase";
import { ShoppingBag, CheckCircle } from "lucide-react";

// 1. IMPORT YOUR IN-HOUSE COMPONENT
import InHouseKitchenView from "../../components/kitchen/InHouseKitchenView";

const OrdersManager = () => {
  // --- STATE ---
  const [orders, setOrders] = useState([]); // Takeaway orders
  const [loading, setLoading] = useState(true);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [view, setView] = useState("active"); // "active" or "history"
  
  // Sound Triggers
  const [hasNewInHouse, setHasNewInHouse] = useState(false);
  const [hasNewTakeaway, setHasNewTakeaway] = useState(false);
  
  const audioRef = useRef(null);

  // --- 1. CENTRALIZED SOUND CONTROL ---
  useEffect(() => {
    // Init Audio
    if (!audioRef.current) {
      audioRef.current = new Audio("/telephone.mp3");
      audioRef.current.loop = true;
    }

    // Logic: Ring if Session Started AND (New Takeaway OR New InHouse)
    if (isSessionStarted && (hasNewTakeaway || hasNewInHouse)) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(err => console.error("Audio blocked:", err));
      }
    } else {
      // Stop ringing if neither has new orders
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isSessionStarted, hasNewTakeaway, hasNewInHouse]); 

  // --- 2. UPDATE STATUS HELPER ---
  const updateStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error(error);
    }
  };

  // --- 3. FETCH TAKEAWAY ORDERS ---
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsub = onSnapshot(q, (snap) => {
      const ordersData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(ordersData);
      setLoading(false);

      // --- LOGIC FIX: Ring ONLY for 'paid' orders ---
      // We ignore 'pending' because the user hasn't paid yet.
      const todayStr = new Date().toDateString();
      const hasNewPaid = ordersData.some(o => 
        o.status === "paid" && 
        (o.createdAt?.toDate().toDateString() === todayStr)
      );

      setHasNewTakeaway(hasNewPaid);
    });

    return () => unsub();
  }, []); 

  // --- 4. FILTERING LOGIC (STRICT PAYMENT CHECK) ---
  const today = new Date().toDateString();
  
  // Active: Show PAID, PREPARING, READY. (Hide 'pending')
  const activeOrders = orders.filter(o => 
    ["paid", "preparing", "ready"].includes(o.status)
  );

  // History: Completed, Cancelled (TODAY ONLY)
  const historyOrders = orders.filter(o => 
    ["completed", "cancelled"].includes(o.status) && 
    (!o.createdAt || o.createdAt?.toDate().toDateString() === today)
  );

  const displayedOrders = view === "active" ? activeOrders : historyOrders;
  

  if (loading) return <div className="p-8 text-center font-bold animate-pulse">Loading Kitchen...</div>;

  return (
    <div className="bg-gray-100 min-h-screen relative p-2 md:p-4 font-sans">
      
      {/* START SHIFT OVERLAY */}
      {!isSessionStarted && (
        <div className="fixed inset-0 bg-gray-900/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-sm animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black mb-2 text-gray-800 uppercase">Kitchen Display</h2>
            <button 
              onClick={() => setIsSessionStarted(true)}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl text-xl shadow-lg hover:bg-green-700 transition-all active:scale-95"
            >
              OPEN KITCHEN 👨‍🍳
            </button>
          </div>
        </div>
      )}

      {/* --- MAIN GRID LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-2rem)]">
        
        {/* LEFT COLUMN: IN-HOUSE (Dining Room) */}
        <div className="h-full overflow-hidden">
           {/* We pass the SETTER so the child can tell us when to ring */}
           <InHouseKitchenView onStatusChange={setHasNewInHouse} />
        </div>

        {/* RIGHT COLUMN: TAKEAWAY (Delivery) */}
        <div className="bg-orange-50/50 p-4 rounded-3xl border border-orange-100 h-full flex flex-col">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-4 border-b border-orange-200 gap-3">
             <div>
               <h1 className="text-xl font-black text-orange-900 uppercase flex items-center gap-2">
                  <ShoppingBag className="text-orange-600"/> Orders
                  {/* Animation for PAID orders only */}
                  {hasNewTakeaway && view === "active" && (
                     <span className="flex h-3 w-3 relative ml-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                     </span>
                  )}
               </h1>
             </div>

             {/* View Switcher */}
             <div className="bg-white p-1 rounded-xl shadow-sm border flex gap-1 w-full sm:w-auto">
                <button 
                  onClick={() => setView("active")} 
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === "active" ? "bg-orange-500 text-white shadow-md" : "text-gray-400 hover:bg-gray-50"}`}
                >
                  ACTIVE ({activeOrders.length})
                </button>
                <button 
                  onClick={() => setView("history")} 
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === "history" ? "bg-gray-800 text-white shadow-md" : "text-gray-400 hover:bg-gray-50"}`}
                >
                  DONE ({historyOrders.length})
                </button>
             </div>
          </div>

          {/* Cards Area */}
          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-4">
            
            {displayedOrders.length === 0 && (
              <div className="text-center py-20 text-orange-300 font-bold italic border-2 border-dashed border-orange-200 rounded-2xl">
                {view === 'active' ? 'No active takeaway orders' : 'No history for today'}
              </div>
            )}

            {displayedOrders.map((order) => {
              // We filter for "paid" in activeOrders, so in "Active" view, these will strictly be PAID.
              const isPaid = order.status === 'paid'; 
              
              return (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden flex flex-col transition-all
                    ${isPaid ? 'border-green-500 ring-4 ring-green-50' : 'border-transparent'}
                  `}
                >
                  
                  {/* Card Header */}
                  <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">{order.customerName || "Customer"}</h3>
                      <p className="text-[10px] text-gray-400 font-mono">
                         #{order.id ? order.id.slice(-5).toUpperCase() : 'ID'} • {order.phone}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${isPaid ? 'bg-green-500 text-white animate-pulse' : 'bg-blue-100 text-blue-800'}`}>
                      {isPaid ? 'NEW PAID' : order.status}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 flex-1">
                    {/* Note */}
                    {(order.note || order.notes) && (
                      <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-700 italic">
                        <span className="font-bold not-italic text-yellow-700">Note:</span> "{order.note || order.notes}"
                      </div>
                    )}

                    {/* Items List */}
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="mb-2 border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                        <div className="flex justify-between">
                          <p className="font-bold text-gray-800 text-sm">
                            <span className="text-orange-600 font-black text-lg mr-1">{item.qty}</span> {item.name}
                          </p>
                        </div>

                        {/* Extras & Spices */}
                        <div className="flex flex-wrap gap-1 mt-1 pl-6">
                           {item.spiceLevel && (
                              <span className="text-[10px] bg-red-50 text-red-600 px-1 rounded font-bold border border-red-100">
                                🔥 {item.spiceLevel}
                              </span>
                           )}
                           {item.extras?.map((e, ei) => (
                              <span key={ei} className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded font-medium border border-gray-200">
                                + {e.label}
                              </span>
                           ))}
                        </div>
                        
                        {item.note && (
                          <p className="mt-1 ml-6 text-[10px] text-blue-500 italic">"{item.note}"</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Card Actions */}
                  <div className="p-3 bg-gray-50 border-t">
                    {/* Button Logic: If PAID, allow moving to PREPARING */}
                    {isPaid ? (
                      <button 
                        onClick={() => updateStatus(order.id, "preparing")} 
                        className="w-full bg-green-600 text-white font-black py-3 rounded-xl animate-pulse text-xs shadow-md shadow-green-200 hover:bg-green-700"
                      >
                        START COOKING
                      </button>
                    ) : (
                       <div className="w-full">
                         {order.status !== 'completed' && order.status !== 'cancelled' ? (
                           <div className="flex gap-2">
                             {order.status !== 'ready' && (
                               <button onClick={() => updateStatus(order.id, "ready")} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg text-xs uppercase hover:bg-blue-700">
                                 Ready
                               </button>
                             )}
                             <button onClick={() => updateStatus(order.id, "completed")} className="flex-1 bg-gray-800 text-white font-bold py-2 rounded-lg text-xs uppercase hover:bg-gray-900">
                               Done
                             </button>
                           </div>
                         ) : (
                            <div className="w-full text-center text-green-600 font-bold text-xs py-1 flex items-center justify-center gap-1 bg-green-50 rounded-lg border border-green-100">
                              <CheckCircle size={14} /> Completed Today
                            </div>
                         )}
                       </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersManager;








/*import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../../components/firebase";
import { ShoppingBag, CheckCircle } from "lucide-react";

// 1. IMPORT YOUR IN-HOUSE COMPONENT
import InHouseKitchenView from "../../components/kitchen/InHouseKitchenView";

const OrdersManager = () => {
  // --- STATE ---
  const [orders, setOrders] = useState([]); // Takeaway orders
  const [loading, setLoading] = useState(true);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [view, setView] = useState("active"); // "active" or "history"
  
  // Sound Triggers
  const [hasNewInHouse, setHasNewInHouse] = useState(false);
  const [hasNewTakeaway, setHasNewTakeaway] = useState(false);
  
  const audioRef = useRef(null);

  // --- 1. CENTRALIZED SOUND CONTROL ---
  useEffect(() => {
    // Init Audio
    if (!audioRef.current) {
      audioRef.current = new Audio("/telephone.mp3");
      audioRef.current.loop = true;
    }

    // Logic: Ring if Session Started AND (New Takeaway OR New InHouse)
    if (isSessionStarted && (hasNewTakeaway || hasNewInHouse)) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(err => console.error("Audio blocked:", err));
      }
    } else {
      // Stop ringing if neither has new orders
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isSessionStarted, hasNewTakeaway, hasNewInHouse]); 

  // --- 2. UPDATE STATUS HELPER ---
  const updateStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error(error);
    }
  };

  // --- 3. FETCH TAKEAWAY ORDERS ---
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsub = onSnapshot(q, (snap) => {
      const ordersData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(ordersData);
      setLoading(false);

      // Check for New Takeaway Orders (Paid or Pending) TODAY
      const todayStr = new Date().toDateString();
      const hasNew = ordersData.some(o => 
        (o.status === "paid" || o.status === "pending") && 
        (o.createdAt?.toDate().toDateString() === todayStr)
      );

      setHasNewTakeaway(hasNew);
    });

    return () => unsub();
  }, []); 

  // --- 4. FILTERING LOGIC (From Code A) ---
  const today = new Date().toDateString();
  
  // Active: Paid, Pending, Preparing, Ready
  const activeOrders = orders.filter(o => 
    ["paid", "pending", "preparing", "ready"].includes(o.status)
  );

  // History: Completed, Cancelled (TODAY ONLY)
  const historyOrders = orders.filter(o => 
    ["completed", "cancelled"].includes(o.status) && 
    (!o.createdAt || o.createdAt?.toDate().toDateString() === today)
  );

  const displayedOrders = view === "active" ? activeOrders : historyOrders;

  if (loading) return <div className="p-8 text-center font-bold animate-pulse">Loading Kitchen...</div>;

  return (
    <div className="bg-gray-100 min-h-screen relative p-2 md:p-4 font-sans">
      
      {/* START SHIFT OVERLAY *//*
      {!isSessionStarted && (
        <div className="fixed inset-0 bg-gray-900/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-sm animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black mb-2 text-gray-800 uppercase">Kitchen Display</h2>
            <button 
              onClick={() => setIsSessionStarted(true)}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl text-xl shadow-lg hover:bg-green-700 transition-all active:scale-95"
            >
              OPEN KITCHEN 👨‍🍳
            </button>
          </div>
        </div>
      )}

      {/* --- MAIN GRID LAYOUT --- *//*
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-[calc(100vh-2rem)]">
        
        {/* LEFT COLUMN: IN-HOUSE (Dining Room) *//*
        <div className="h-full overflow-hidden">
           {/* We pass the SETTER so the child can tell us when to ring *//*
           <InHouseKitchenView onStatusChange={setHasNewInHouse} />
        </div>

        {/* RIGHT COLUMN: TAKEAWAY (Delivery) *//*
        <div className="bg-orange-50/50 p-4 rounded-3xl border border-orange-100 h-full flex flex-col">
          
          {/* Header *//*
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-4 border-b border-orange-200 gap-3">
             <div>
               <h1 className="text-xl font-black text-orange-900 uppercase flex items-center gap-2">
                  <ShoppingBag className="text-orange-600"/> Takeaway
                  {hasNewTakeaway && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
               </h1>
             </div>

             {/* View Switcher *//*
             <div className="bg-white p-1 rounded-xl shadow-sm border flex gap-1 w-full sm:w-auto">
                <button 
                  onClick={() => setView("active")} 
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === "active" ? "bg-orange-500 text-white shadow-md" : "text-gray-400 hover:bg-gray-50"}`}
                >
                  ACTIVE ({activeOrders.length})
                </button>
                <button 
                  onClick={() => setView("history")} 
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === "history" ? "bg-gray-800 text-white shadow-md" : "text-gray-400 hover:bg-gray-50"}`}
                >
                  DONE ({historyOrders.length})
                </button>
             </div>
          </div>

          {/* Cards Area *//*
          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-4">
            
            {displayedOrders.length === 0 && (
              <div className="text-center py-20 text-orange-300 font-bold italic border-2 border-dashed border-orange-200 rounded-2xl">
                {view === 'active' ? 'No active takeaway orders' : 'No history for today'}
              </div>
            )}

            {displayedOrders.map((order) => {
              const isPaid = order.status === 'paid' || order.status === 'pending'; // Treat pending like paid for display
              
              return (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden flex flex-col transition-all
                    ${isPaid ? 'border-green-500 ring-4 ring-green-50' : 'border-transparent'}
                  `}
                >
                  
                  {/* Card Header *//*
                  <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">{order.customerName || "Customer"}</h3>
                      <p className="text-[10px] text-gray-400 font-mono">#{order.id ? order.id.slice(-5).toUpperCase() : 'ID'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${isPaid ? 'bg-green-500 text-white animate-pulse' : 'bg-blue-100 text-blue-800'}`}>
                      {isPaid ? 'NEW ORDER' : order.status}
                    </span>
                  </div>

                  {/* Card Body *//*
                  <div className="p-3 flex-1">
                    {/* Note *//*
                    {(order.note || order.notes) && (
                      <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-700 italic">
                        <span className="font-bold not-italic text-yellow-700">Note:</span> "{order.note || order.notes}"
                      </div>
                    )}

                    {/* Items List (Using Detail Logic from Code A) *//*
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="mb-2 border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                        <div className="flex justify-between">
                          <p className="font-bold text-gray-800 text-sm">
                            <span className="text-orange-600 font-black text-lg mr-1">{item.qty}</span> {item.name}
                          </p>
                        </div>

                        {/* Extras & Spices *//*
                        <div className="flex flex-wrap gap-1 mt-1 pl-6">
                           {item.spiceLevel && (
                              <span className="text-[10px] bg-red-50 text-red-600 px-1 rounded font-bold border border-red-100">
                                🔥 {item.spiceLevel}
                              </span>
                           )}
                           {item.extras?.map((e, ei) => (
                              <span key={ei} className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded font-medium border border-gray-200">
                                + {e.label}
                              </span>
                           ))}
                        </div>
                        
                        {item.note && (
                          <p className="mt-1 ml-6 text-[10px] text-blue-500 italic">"{item.note}"</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Card Actions (Using Logic from Code A to show "Completed") *//*
                  <div className="p-3 bg-gray-50 border-t">
                    {isPaid ? (
                      <button 
                        onClick={() => updateStatus(order.id, "preparing")} 
                        className="w-full bg-green-600 text-white font-black py-3 rounded-xl animate-pulse text-xs shadow-md shadow-green-200 hover:bg-green-700"
                      >
                        START COOKING
                      </button>
                    ) : (
                       <div className="w-full">
                         {order.status !== 'completed' && order.status !== 'cancelled' ? (
                           <div className="flex gap-2">
                             {order.status !== 'ready' && (
                               <button onClick={() => updateStatus(order.id, "ready")} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg text-xs uppercase hover:bg-blue-700">
                                 Ready
                               </button>
                             )}
                             <button onClick={() => updateStatus(order.id, "completed")} className="flex-1 bg-gray-800 text-white font-bold py-2 rounded-lg text-xs uppercase hover:bg-gray-900">
                               Done
                             </button>
                           </div>
                         ) : (
                            <div className="w-full text-center text-green-600 font-bold text-xs py-1 flex items-center justify-center gap-1 bg-green-50 rounded-lg border border-green-100">
                              <CheckCircle size={14} /> Completed Today
                            </div>
                         )}
                       </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersManager;*/












//perfect page
/*import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../../components/firebase";

const OrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [view, setView] = useState("active"); // "active" or "history"
  
  const audioRef = useRef(null);
  // Remove isInitialLoad ref, we will use status check for ringing

  const updateStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const startRinging = () => {
      if (!isSessionStarted) return; 
      if (!audioRef.current) {
        audioRef.current = new Audio("/telephone.mp3");
        audioRef.current.loop = true;
      }
      if (audioRef.current.paused) {
        audioRef.current.play().catch(err => console.error("Audio blocked:", err));
      }
    };

    const stopRinging = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsub = onSnapshot(q, (snap) => {
      const ordersData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      setOrders(ordersData);
      setLoading(false);

      // --- LOGIC FIX: Ring ONLY for 'paid' orders ---
      // We ignore 'pending' because the user hasn't paid yet.
      const hasNewPaidOrder = ordersData.some(o => o.status === "paid");

      if (hasNewPaidOrder) {
        startRinging();
      } else {
        stopRinging();
      }
    });

    return () => {
      unsub();
      stopRinging();
    };
  }, [isSessionStarted]); 

  const today = new Date().toDateString();
  
  // --- LOGIC FIX: Filter Definitions ---
  
  // 1. Active: Show PAID, PREPARING, READY. (Hide 'pending')
  const activeOrders = orders.filter(o => 
    ["paid", "preparing", "ready"].includes(o.status)
  );

  // 2. History: Only orders Completed/Cancelled
  const historyOrders = orders.filter(o => 
    ["completed", "cancelled"].includes(o.status) && 
    (!o.createdAt || o.createdAt?.toDate().toDateString() === today)
  );

  const displayedOrders = view === "active" ? activeOrders : historyOrders;

  if (loading) return <div className="p-8 text-center font-bold">Connecting...</div>;

  return (
    <div className="bg-gray-100 min-h-screen relative">
      
      {!isSessionStarted && (
        <div className="fixed inset-0 bg-yellow-500/90 z-[100] flex flex-col items-center justify-center text-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm">
            <h2 className="text-2xl font-black mb-4 uppercase">Kitchen Ready?</h2>
            <button 
              onClick={() => setIsSessionStarted(true)}
              className="w-full bg-black text-white font-bold py-4 rounded-2xl text-lg shadow-lg"
            >
              START SHIFT 👨‍🍳
            </button>
          </div>
        </div>
      )}

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-2 uppercase">
              {view === "active" ? "🔥 Active Kitchen" : "✅ Today's History"}
              {/* Animation for PAID orders only *//*
              {activeOrders.some(o => o.status === 'paid') && view === "active" && (
                <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
              )}
            </h1>

            {/* View Switcher *//*
            <div className="bg-white p-1 rounded-xl shadow-sm border flex gap-1">
              <button 
                onClick={() => setView("active")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === "active" ? "bg-yellow-500 text-black shadow-inner" : "text-gray-400"}`}
              >
                ACTIVE ({activeOrders.length})
              </button>
              <button 
                onClick={() => setView("history")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === "history" ? "bg-gray-800 text-white shadow-inner" : "text-gray-400"}`}
              >
                DONE ({historyOrders.length})
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedOrders.map((order) => (
            <div 
              key={order.id} 
              className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden flex flex-col 
                ${order.status === 'paid' ? 'border-green-500 ring-4 ring-green-100' : 'border-transparent'}
              `}
            >
              
              <div className="p-4 border-b bg-gray-50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{order.customerName}</h3>
                  <p className="text-xs text-gray-500 font-mono">
                    {/* Safe slice just in case *//*
                    #{order.id ? order.id.slice(-5).toUpperCase() : 'ID'} • {order.phone}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase 
                  ${order.status === 'paid' ? 'bg-green-500 text-white animate-pulse' : 'bg-blue-100 text-blue-800'}
                `}>
                  {order.status === 'paid' ? 'NEW PAID' : order.status}
                </span>
              </div>

              <div className="p-4 flex-1">
                {/* 1. TOP LEVEL NOTE *//*
                {(order.notes || order.note) && (
                  <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl shadow-sm">
                    <p className="text-[10px] font-black text-yellow-700 uppercase mb-1 underline">Order Instructions:</p>
                    <p className="text-sm font-bold text-gray-800 leading-tight">"{order.notes || order.note}"</p>
                  </div>
                )}

                {order.items?.map((item, idx) => (
                  <div key={idx} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="flex justify-between">
                      <p className="font-bold text-gray-900">
                        <span className="text-yellow-600 font-black">{item.qty}x</span> {item.name}
                      </p>
                    </div>

                    {item.spiceLevel && (
                      <p className="text-[10px] text-orange-600 font-black uppercase italic mt-1">
                        🔥 Spice: {item.spiceLevel}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.extras?.map((e, ei) => (
                        <span key={ei} className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded uppercase font-medium">
                          +{e.label}
                        </span>
                      ))}
                    </div>
                    {/* 2. ITEM LEVEL NOTE *//*
                    {item.note && (
                      <p className="mt-1 text-xs text-gray-600 italic px-2 py-1 rounded border">
                        Note: {item.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gray-50 border-t mt-auto">
                {/* Button Logic: If PAID, allow moving to PREPARING *//*
                {order.status === 'paid' ? (
                  <button 
                    onClick={() => updateStatus(order.id, "preparing")} 
                    className="w-full bg-green-600 text-white font-black py-4 rounded-xl animate-pulse text-sm shadow-lg shadow-green-200"
                  >
                    START COOKING
                  </button>
                ) : (
                   <div className="flex gap-2">
                     {order.status !== 'completed' && (
                       <>
                        <button onClick={() => updateStatus(order.id, "ready")} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Ready</button>
                        <button onClick={() => updateStatus(order.id, "completed")} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Done</button>
                       </>
                     )}
                     {order.status === 'completed' && (
                        <div className="w-full text-center text-green-600 font-bold text-sm py-2 italic">✓ Completed Today</div>
                     )}
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {displayedOrders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed text-gray-400 font-bold">
            No orders here. Take a break! ☕
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersManager;*/











/*import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../../components/firebase";
import { ShoppingBag, Bike } from 'lucide-react';

// 1. IMPORT THE IN-HOUSE COMPONENT
import InHouseKitchenView from "../../components/kitchen/InHouseKitchenView";

const OrdersManager = () => {
  const [takeawayOrders, setTakeawayOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [view, setView] = useState("active"); 
  
  const audioRef = useRef(null);

  // --- SOUND CONTROLLER ---
  const playSound = () => {
    if (isSessionStarted && audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(e => console.log("Audio blocked:", e));
    }
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // --- TAKEAWAY BADGE HELPER ---
  const getTakeawayBadge = (order) => {
    if (order.orderType === 'delivery') {
      return { label: "DELIVERY", color: "bg-purple-100 text-purple-700", icon: <Bike size={14} />, border: "border-purple-200" };
    }
    return { label: "TAKEAWAY", color: "bg-orange-100 text-orange-700", icon: <ShoppingBag size={14} />, border: "border-orange-200" };
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: newStatus });
    } catch (error) { console.error(error); }
  };

  // --- MAIN EFFECT (Data & Sound) ---
  useEffect(() => {
    // Init Audio
    if (!audioRef.current) {
      audioRef.current = new Audio("/telephone.mp3");
      audioRef.current.loop = true;
    }

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsub = onSnapshot(q, (snap) => {
      const ordersData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTakeawayOrders(ordersData);
      setLoading(false);

      // --- FIX: ONLY RING FOR TODAY'S NEW ORDERS ---
      const todayStr = new Date().toDateString();
      
      const hasNewTakeaway = ordersData.some(o => {
        // 1. Must be 'paid' or 'pending'
        const isNew = o.status === "paid" || o.status === "pending";
        // 2. Must be from TODAY (Fixes the infinite ringing bug)
        const isToday = o.createdAt?.toDate().toDateString() === todayStr;
        return isNew && isToday;
      });

      if (hasNewTakeaway) {
        playSound();
      } else {
        // Only stop if InHouse isn't ringing (handled via prop below)
        // For simple logic, we rely on the InHouse component to also trigger playSound if needed
        stopSound();
      }
    });

    return () => { unsub(); stopSound(); };
  }, [isSessionStarted]); 


  // --- FILTER LOGIC ---
  const today = new Date().toDateString();
  const activeOrders = takeawayOrders.filter(o => ["paid", "pending", "preparing", "ready"].includes(o.status));
  const historyOrders = takeawayOrders.filter(o => ["completed", "cancelled"].includes(o.status) && o.createdAt?.toDate().toDateString() === today);
  const displayedOrders = view === "active" ? activeOrders : historyOrders;


  if (loading) return <div className="p-8 text-center font-bold">Loading Kitchen...</div>;

  return (
    <div className="bg-gray-100 min-h-screen relative p-4 md:p-6">
      
      
      {!isSessionStarted && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center text-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black mb-6 uppercase text-gray-800">Kitchen Display</h2>
            <button 
              onClick={() => setIsSessionStarted(true)}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl text-xl shadow-xl hover:bg-green-700 transition-transform active:scale-95"
            >
              START SHIFT 👨‍🍳
            </button>
          </div>
        </div>
      )}

      {/* --- MAIN GRID: SPLIT COLUMNS --- *//*
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        
        {/* LEFT COLUMN: IN-HOUSE (New Component) *//*
   
        <InHouseKitchenView playSound={playSound} />


        {/* RIGHT COLUMN: TAKEAWAY (Existing Logic) *//*
        <div className="bg-orange-50/50 p-4 rounded-3xl border border-orange-100 min-h-[85vh]">
          
          {/* Header *//*
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-orange-200">
            <h2 className="text-xl font-black text-orange-900 uppercase flex items-center gap-2">
              <ShoppingBag className="text-orange-600"/> Takeaway / Delivery
            </h2>
            <div className="bg-white p-1 rounded-xl shadow-sm border flex gap-1">
              <button onClick={() => setView("active")} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${view === "active" ? "bg-orange-500 text-white" : "text-gray-400"}`}>ACTIVE ({activeOrders.length})</button>
              <button onClick={() => setView("history")} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${view === "history" ? "bg-gray-800 text-white" : "text-gray-400"}`}>DONE</button>
            </div>
          </div>

          {/* Cards Grid *//*
          <div className="space-y-4">
            {displayedOrders.length === 0 && (
              <div className="text-center py-20 text-orange-300 font-bold italic">No takeaway orders</div>
            )}

            {displayedOrders.map((order) => {
              const badge = getTakeawayBadge(order);
              
              return (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden flex flex-col transition-all
                    ${badge.border}
                    ${order.status === 'paid' ? 'ring-4 ring-green-100 border-green-400' : ''}
                  `}
                >
                  {/* Header *//*
                  <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${badge.color}`}>
                        {badge.icon} {badge.label}
                      </span>
                      <span className="text-xs font-bold text-gray-800">{order.customerName || "Customer"}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                      order.status === 'paid' || order.status === 'pending' ? 'bg-green-500 text-white animate-pulse' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status === 'paid' || order.status === 'pending' ? 'NEW' : order.status}
                    </span>
                  </div>

                  {/* Body *//*
                  <div className="p-4 flex-1">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="mb-2 last:mb-0 flex gap-3 border-b border-dashed border-gray-100 last:border-0 pb-2 last:pb-0">
                        <span className="font-black text-gray-800 text-lg w-6">{item.qty}</span>
                        <div className="flex-1">
                          <p className="font-bold text-gray-700 text-sm leading-tight">{item.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.spiceLevel && <span className="text-[10px] bg-red-50 text-red-600 px-1 rounded font-bold border border-red-100">🔥 {item.spiceLevel}</span>}
                            {item.extras?.map((e, i) => <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded border border-gray-200">+ {e.label}</span>)}
                          </div>
                          {item.note && <p className="text-xs text-blue-500 italic mt-1 bg-blue-50 p-1 rounded inline-block">"{item.note}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions *//*
                  <div className="p-3 bg-gray-50 border-t flex gap-2">
                    {order.status === 'paid' || order.status === 'pending' ? (
                      <button onClick={() => updateStatus(order.id, "preparing")} className="w-full bg-green-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase shadow-sm hover:bg-green-700">Start Cooking</button>
                    ) : (
                      <>
                        {order.status !== 'completed' && <button onClick={() => updateStatus(order.id, "ready")} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg text-xs uppercase">Ready</button>}
                        <button onClick={() => updateStatus(order.id, "completed")} className="flex-1 bg-gray-800 text-white font-bold py-2 rounded-lg text-xs uppercase">Archive</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrdersManager;*/

