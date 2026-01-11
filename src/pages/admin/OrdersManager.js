import { useEffect, useState, useRef } from "react";
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
              {/* Animation for PAID orders only */}
              {activeOrders.some(o => o.status === 'paid') && view === "active" && (
                <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
              )}
            </h1>

            {/* View Switcher */}
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
                    {/* Safe slice just in case */}
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
                {/* 1. TOP LEVEL NOTE */}
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
                    {/* 2. ITEM LEVEL NOTE */}
                    {item.note && (
                      <p className="mt-1 text-xs text-gray-600 italic px-2 py-1 rounded border">
                        Note: {item.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gray-50 border-t mt-auto">
                {/* Button Logic: If PAID, allow moving to PREPARING */}
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

export default OrdersManager;




























/*import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../../components/firebase";

const OrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [view, setView] = useState("active"); // "active" or "history"
  
  const audioRef = useRef(null);
  const isInitialLoad = useRef(true);

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
      snap.docChanges().forEach((change) => {
        if (change.type === "added" && !isInitialLoad.current) {
          startRinging();
        }
      });

      const ordersData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const hasPending = ordersData.some(o => o.status === "pending");
      if (!hasPending) stopRinging();

      setOrders(ordersData);
      setLoading(false);
      isInitialLoad.current = false;
    });

    return () => {
      unsub();
      stopRinging();
    };
  }, [isSessionStarted]); 

  // --- Logic to handle the "Pile-up" ---
  const today = new Date().toDateString();
  
  // 1. Active: Only Pending, Preparing, or Ready (Regardless of date)
  const activeOrders = orders.filter(o => 
    ["pending", "preparing", "ready"].includes(o.status)
  );

  // 2. History: Only orders Completed/Cancelled TODAY
  const historyOrders = orders.filter(o => 
    ["completed", "cancelled"].includes(o.status) && 
    o.createdAt?.toDate().toDateString() === today
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
              {activeOrders.some(o => o.status === 'pending') && view === "active" && (
                <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
              )}
            </h1>

            {/* View Switcher: Solves the Pile-up *//*
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
            <div key={order.id} className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden flex flex-col ${order.status === 'pending' ? 'border-yellow-400 ring-4 ring-yellow-100' : 'border-transparent'}`}>
              
              <div className="p-4 border-b bg-gray-50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{order.customerName}</h3>
                  <p className="text-xs text-gray-500 font-mono">#{/*order.id.slice(-5)*}Phone • {order.phone}</p>
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${order.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                  {order.status}
                </span>
              </div>

              <div className="p-4 flex-1">
  {/* 1. TOP LEVEL NOTE (General instructions for the whole order) *//*
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
       {/* 2. ITEM LEVEL NOTE (Instructions from the Item Modal) *//*
      {item.note && (
        <p className="mt-1 text-xs text-gray-600 italic px-2 py-1 rounded border">
          Note: {item.note}
        </p>
      )}
    </div>
  ))}
</div>
              <div className="p-4 bg-gray-50 border-t mt-auto">
                {order.status === 'pending' ? (
                  <button onClick={() => updateStatus(order.id, "preparing")} className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl animate-pulse text-sm">ACCEPT ORDER</button>
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

const OrdersManager = () => {
  /*const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // This state tracks if the kitchen staff has "unlocked" sound for this session
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  
  const audioRef = useRef(null);
  const isInitialLoad = useRef(true);

  /* ----------------------------------
     Sound Controls
  -----------------------------------
  const startRinging = () => {
    // If the user hasn't clicked "Start Session", we can't play sound yet
    if (!isSessionStarted) return; 

    if (!audioRef.current) {
      audioRef.current = new Audio("/telephone.mp3");
      audioRef.current.loop = true;
    }
    if (audioRef.current.paused) {
      audioRef.current.play().catch(err => console.error("Audio blocked by browser. Click the page!"));
    }
  };

  const stopRinging = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  /* ----------------------------------
     Real-time Sync & Auto-Ring Logic
  -----------------------------------
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsub = onSnapshot(q, (snap) => {
      // 1. Listen for new incoming orders
      snap.docChanges().forEach((change) => {
        if (change.type === "added" && !isInitialLoad.current) {
          // A brand new order arrived!
          startRinging();
        }
      });

      const ordersData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // 2. Auto-stop if no pending orders are left
      const hasPending = ordersData.some(o => o.status === "pending");
      if (!hasPending) {
        stopRinging();
      }

      setOrders(ordersData);
      setLoading(false);
      isInitialLoad.current = false;
    });

    return () => {
      unsub();
      stopRinging();
    };
  }, [isSessionStarted]); // Effect re-runs once session starts to allow audio

  const updateStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error(error);
    }
  };*/

 /*   const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  
  const audioRef = useRef(null);
  const isInitialLoad = useRef(true);

  /* ----------------------------------
     Update Order Status (External)
  -----------------------------------*/
/*  const updateStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error(error);
    }
  };

  /* ----------------------------------
     Real-time Sync & Auto-Ring Logic
  -----------------------------------*/
  /*useEffect(() => {
    // 1. Define sound functions INSIDE the hook to fix ESLint error
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
      snap.docChanges().forEach((change) => {
        if (change.type === "added" && !isInitialLoad.current) {
          startRinging();
        }
      });

      const ordersData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      const hasPending = ordersData.some(o => o.status === "pending");
      if (!hasPending) {
        stopRinging();
      }

      setOrders(ordersData);
      setLoading(false);
      isInitialLoad.current = false;
    });

    return () => {
      unsub();
      stopRinging();
    };
    // isSessionStarted is correctly listed here
  }, [isSessionStarted]); 


  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="bg-gray-100 min-h-screen relative">
      
      {/* 🛡️ BROWSER PROTECTION OVERLAY *
      {!isSessionStarted && (
        <div className="fixed inset-0 bg-yellow-500/90 z-[100] flex flex-col items-center justify-center text-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm">
            <h2 className="text-2xl font-black mb-4 uppercase">Kitchen Ready?</h2>
            <p className="text-gray-600 mb-6">Click the button below to enable the order ringtone for this session.</p>
            <button 
              onClick={() => setIsSessionStarted(true)}
              className="w-full bg-black text-white font-bold py-4 rounded-2xl text-lg hover:scale-105 transition-transform"
            >
              START SHIFT 👨‍🍳
            </button>
          </div>
        </div>
      )}

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Live Orders
            {orders.some(o => o.status === 'pending') && (
              <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
            )}
          </h1>
          <div className="text-xs font-bold px-3 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
            ● System Active & Monitoring
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div key={order.id} className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden flex flex-col ${order.status === 'pending' ? 'border-yellow-400 ring-4 ring-yellow-100' : 'border-transparent'}`}>
              
              {/* Customer Header *
              <div className="p-4 border-b bg-gray-50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{order.customerName}</h3>
                  <p className="text-sm text-gray-500">{order.phone}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {order.status}
                </span>
              </div>

              {/* Items Section *
              <div className="p-4 flex-1">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="mb-3">
                    <p className="font-bold text-gray-900"><span className="text-yellow-600">{item.qty}x</span> {item.name}</p>
                    {item.spiceLevel && <p className="text-[11px] text-orange-700 font-bold uppercase italic">Spice: {item.spiceLevel}</p>}
                    {item.extras?.map((e, ei) => (
                      <p key={ei} className="text-xs text-gray-500 ml-4">• {e.label}</p>
                    ))}
                  </div>
                ))}
                
                {/* Instructions *
                {(order.note || order.notes) && (
                  <div className="mt-4 p-2 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <p className="text-[10px] font-bold text-blue-500 uppercase">Note:</p>
                    <p className="text-sm italic text-blue-900 leading-tight">{order.note || order.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions *
              <div className="p-4 bg-gray-50 border-t mt-auto">
                {order.status === 'pending' ? (
                  <button 
                    onClick={() => updateStatus(order.id, "preparing")}
                    className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl hover:bg-yellow-600 transition animate-pulse uppercase tracking-widest"
                  >
                    Accept Order
                  </button>
                ) : (
                   <div className="flex gap-2">
                     <button onClick={() => updateStatus(order.id, "ready")} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg text-xs uppercase">Mark Ready</button>
                     <button onClick={() => updateStatus(order.id, "completed")} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg text-xs uppercase">Complete</button>
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersManager;*/