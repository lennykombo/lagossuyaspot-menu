import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, addDoc, onSnapshot, updateDoc, doc, 
  serverTimestamp, query, where, orderBy, writeBatch
} from 'firebase/firestore';
import { db } from '../../components/firebase';
import POSItemModal from './POSItemModal'; 
import TableBillModal from './TableBillModal';
import { 
  ChevronLeft, Send, Plus, Minus, Search, Grid, Trash2, CheckCircle, Receipt, Clock, BellRing
} from 'lucide-react';
//import WaiterNotificationWidget from './WaiterNotificationWidget';

// --- COLOR MAPPING ---
const CATEGORY_COLORS = {
  "BREAKFAST": "bg-yellow-600",
  "BEEF": "bg-blue-600",
  "CHICKEN": "bg-green-700",
  "FISH": "bg-pink-600",
  "DRINKS": "bg-orange-600",
  "ALCOHOL": "bg-yellow-500",
  "SOUPS": "bg-yellow-400",
  "SALADS": "bg-blue-500",
  "WINES": "bg-pink-500",
  "WHISKEY": "bg-green-800",
  "DEFAULT": ["bg-teal-600", "bg-indigo-600", "bg-purple-600", "bg-red-600"]
};

const POS = () => {
  const { tableId, tableName } = useParams();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [categories, setCategories] = useState([]); 
  const [items, setItems] = useState([]);           
  const [cart, setCart] = useState([]);
  
  // Filter States
  const [activeCategoryId, setActiveCategoryId] = useState("All"); 
  const [searchQuery, setSearchQuery] = useState("");
  
  // System States
  const [waiter, setWaiter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Modal States
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  
  // Bill History State
  const [previousOrders, setPreviousOrders] = useState([]);

  // --- 1. AUTH CHECK ---
  useEffect(() => {
    const w = localStorage.getItem('currentWaiter');
    if (!w) navigate('/waiter/login');
    else setWaiter(JSON.parse(w));
  }, [navigate]);

  // --- 2. FETCH MENU DATA ---
  useEffect(() => {
    const catQuery = query(collection(db, "categories"), orderBy("name", "asc"));
    const unsubCats = onSnapshot(catQuery, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const itemQuery = query(collection(db, "menuItems"), where("available", "==", true));
    const unsubItems = onSnapshot(itemQuery, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsubCats(); unsubItems(); };
  }, []);

  // --- 3. FETCH TABLE HISTORY ---
  useEffect(() => {
    if (!tableId) return;
    // We query 'inhouseorders' to show history in the cart list
    const q = query(
      collection(db, "inhouseorders"), 
      where("tableId", "==", tableId),
      orderBy("createdAt", "asc")
    );

    const unsubHistory = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const activeOrders = allOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
      setPreviousOrders(activeOrders);
    });
    
    return () => unsubHistory();
  }, [tableId]);

  // --- 4. FILTER LOGIC ---
  const filteredItems = items.filter(item => {
    if (searchQuery) return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeCategoryId === "All") return true;
    return item.categoryId === activeCategoryId;
  });

  // --- 5. CART LOGIC ---
  const addToCart = (item) => {
    const needsModal = item.hasSpiceLevels || (item.extras && item.extras.length > 0);
    if (needsModal) {
      setSelectedItemForModal(item);
    } else {
      const simpleItem = { ...item, qty: 1, variantId: item.id, price: Number(item.price) };
      setCart(prev => {
        const existing = prev.find(i => i.variantId === simpleItem.variantId);
        if (existing) return prev.map(i => i.variantId === simpleItem.variantId ? { ...i, qty: i.qty + 1 } : i);
        return [...prev, simpleItem];
      });
    }
  };

  const handleModalConfirm = (configuredItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.variantId === configuredItem.variantId);
      if (existing) return prev.map(i => i.variantId === configuredItem.variantId ? { ...i, qty: i.qty + configuredItem.qty } : i);
      return [...prev, configuredItem];
    });
    setSelectedItemForModal(null);
  };

  const updateQty = (variantId, change) => {
    setCart(prev => prev.map(item => {
      if (item.variantId === variantId) return { ...item, qty: Math.max(1, item.qty + change) };
      return item;
    }));
  };

  const removeFromCart = (variantId) => {
    setCart(prev => prev.filter(i => i.variantId !== variantId));
  };

  // Totals
  const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const previousTotal = previousOrders.reduce((sum, order) => {
     const orderTotal = Number(order.totalAmount);
     if (!isNaN(orderTotal) && orderTotal > 0) return sum + orderTotal;
     const itemsSum = order.items?.reduce((s, i) => s + (i.price * i.qty), 0) || 0;
     return sum + itemsSum;
  }, 0);
  const grandTotal = previousTotal + cartTotal;

  // --- 6. SUBMIT ORDER ---
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      await addDoc(collection(db, "inhouseorders"), {
        tableId, tableName, waiterId: waiter.id, waiterName: waiter.name,
        items: cart, totalAmount: cartTotal, status: "pending", orderType: "dine-in", createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "tables", tableId), { status: "occupied" });
      setCart([]);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 2500);
    } catch (err) { alert("Error sending order"); }
  };

  // --- 7. HANDLE PAYMENT ---
  const handlePayment = async () => {
    try {
      const batch = writeBatch(db);
      const newReceiptRef = doc(collection(db, "receipts"));
      const allItems = previousOrders.flatMap(o => o.items || []);
      
      batch.set(newReceiptRef, {
        receiptId: newReceiptRef.id, tableId, tableName, waiterId: waiter.id, waiterName: waiter.name,
        items: allItems, totalAmount: previousTotal, createdAt: serverTimestamp(), relatedOrderIds: previousOrders.map(o => o.id) 
      });

      batch.update(doc(db, "tables", tableId), { status: "available" });
      previousOrders.forEach((order) => {
        batch.update(doc(db, "inhouseorders", order.id), { status: "completed", paymentReceiptId: newReceiptRef.id });
      });

      await batch.commit();
      setShowBillModal(false);
      navigate('/waiter/tables');
    } catch (err) { console.error(err); alert("Payment failed."); }
  };

  // Helper
  const getCategoryColor = (catName, index) => {
    if (catName === "All") return "bg-gray-800";
    const upper = catName.toUpperCase();
    if (CATEGORY_COLORS[upper]) return CATEGORY_COLORS[upper];
    return CATEGORY_COLORS.DEFAULT[index % CATEGORY_COLORS.DEFAULT.length];
  };

    // --- 8. READY NOTIFICATIONS ---
  const readyOrders = previousOrders.filter(o => o.status === 'ready');
  const markAsServed = async (orderId) => {
    try { await updateDoc(doc(db, "inhouseorders", orderId), { status: 'served' }); } catch (e) { console.error(e); }
  };


  if (loading) return <div className="h-screen flex items-center justify-center font-bold">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans relative">

      {/*<WaiterNotificationWidget/>*/}
      
      {/* SUCCESS OVERLAY */}
      {orderSuccess && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4"><CheckCircle size={40} /></div>
            <h2 className="text-2xl font-black text-gray-800">Sent to Kitchen!</h2>
          </div>
        </div>
      )}

      {/* --- LEFT COL: MENU --- */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="bg-white border-b p-2 flex items-center justify-between h-14 shrink-0 shadow-sm z-20">
          <button onClick={() => navigate('/waiter/tables')} className="flex items-center gap-1 text-gray-600 font-bold px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">
            <ChevronLeft size={18} /> Tables
          </button>
          <div className="relative w-1/2">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="h-[50%] bg-white p-2 overflow-y-auto border-b-4 border-gray-200">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            <button onClick={() => { setActiveCategoryId("All"); setSearchQuery(""); }} className={`p-4 rounded-xl shadow-sm text-left font-bold text-xs md:text-sm uppercase text-white transition-all active:scale-95 bg-gray-800 ${activeCategoryId === "All" ? "ring-4 ring-black scale-105 z-10 shadow-xl" : "opacity-90 hover:opacity-100"}`}>
              ALL MENU <div className="text-[10px] font-normal opacity-70 mt-1 lowercase">{items.length} items</div>
            </button>
            {categories.map((cat, idx) => (
              <button key={cat.id} onClick={() => { setActiveCategoryId(cat.id); setSearchQuery(""); }} className={`p-4 rounded-xl shadow-sm text-left font-bold text-xs md:text-sm uppercase text-white transition-all active:scale-95 break-words ${getCategoryColor(cat.name, idx)} ${activeCategoryId === cat.id ? "ring-4 ring-black scale-105 z-10 shadow-xl" : "opacity-90 hover:opacity-100"}`}>
                {cat.name} <div className="text-[10px] font-normal opacity-70 mt-1 lowercase">{items.filter(i=>i.categoryId === cat.id).length} items</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-gray-100 p-2 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400"><Grid size={48} className="opacity-20 mb-2" /><p>No items found.</p></div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pb-20">
              {filteredItems.map(item => (
                <button key={item.id} onClick={() => addToCart(item)} className="bg-white p-3 rounded-xl shadow-sm border border-transparent hover:border-green-500 active:bg-green-50 flex flex-col justify-between h-32 text-left transition-all relative overflow-hidden group">
                  {item.imageUrl && <div className="absolute top-0 right-0 w-12 h-12 bg-gray-100 rounded-bl-2xl"><img src={item.imageUrl} alt="" className="w-full h-full object-cover rounded-bl-2xl opacity-80 group-hover:opacity-100" /></div>}
                  <span className="font-bold text-gray-800 text-xs md:text-sm leading-tight line-clamp-2 z-10 pr-8">{item.name}</span>
                  <div className="flex justify-between items-end w-full z-10 mt-auto">
                    <span className="text-green-700 font-black text-sm">{Number(item.price).toLocaleString()}</span>
                    {(item.hasSpiceLevels || (item.extras && item.extras.length > 0)) && <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Options</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- RIGHT COL: CART & HISTORY --- */}
      <div className="w-[380px] bg-white border-l shadow-2xl flex flex-col z-30 shrink-0">

         {readyOrders.length > 0 && (
            <div className="bg-blue-600 text-white p-4 animate-pulse shadow-lg z-50">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-black uppercase tracking-wider"><BellRing className="animate-bounce" /> Order Ready!</div>
                </div>
                <div className="space-y-2">
                    {readyOrders.map(order => (
                        <div key={order.id} className="bg-white/10 p-2 rounded flex justify-between items-center">
                            <span className="text-xs font-bold">{order.items.length} items waiting</span>
                            <button onClick={() => markAsServed(order.id)} className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-100 shadow-sm uppercase">Mark Served</button>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-gray-800 uppercase">Table {tableName}</h2>
            <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold uppercase">{waiter?.name}</span>
          </div>
          <button onClick={() => setShowBillModal(true)} className="w-full bg-white border-2 border-yellow-400 text-yellow-700 py-3 rounded-xl font-bold text-sm flex items-center justify-between px-4 hover:bg-yellow-50 transition-colors shadow-sm">
            <span className="flex items-center gap-2"><Receipt size={18}/> View Full Bill</span>
            <span className="text-lg text-black">Ksh {grandTotal.toLocaleString()}</span>
          </button>
        </div>

        {/* COMBINED LIST: HISTORY + CART */}
        <div className="flex-1 overflow-y-auto p-2">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-xs text-gray-400 uppercase border-b bg-white sticky top-0 z-10">
              <tr><th className="py-2 pl-2">Item</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right pr-2">Price</th></tr>
            </thead>
            
            <tbody className="divide-y">
              
              {/* 1. HISTORY (SENT ITEMS) - VISUALLY DISTINCT */}
              {previousOrders.length > 0 && previousOrders.map((order) => (
                order.items.map((item, idx) => (
                  <tr key={`${order.id}-${idx}`} className="bg-gray-100/70 text-gray-500">
                    <td className="py-3 pl-2 pr-2 align-top">
                      <div className="font-bold text-gray-600 text-sm">{item.name}</div>
                      <div className="space-y-0.5 mt-0.5 opacity-80">
                         {item.selectedSpice && <div className="text-[10px] text-gray-500">🔥 {item.selectedSpice}</div>}
                         {item.selectedExtras?.map((e, i) => <div key={i} className="text-[10px]">+ {e.label}</div>)}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 w-fit px-1.5 py-0.5 rounded border border-green-100">
                        <CheckCircle size={10} /> SENT {new Date(order.createdAt?.seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="py-3 text-center align-top pt-2">
                      <span className="font-mono font-bold text-gray-400">{item.qty}</span>
                    </td>
                    <td className="py-3 pr-2 text-right font-bold text-gray-400 align-top pt-2">
                      {(item.price * item.qty).toLocaleString()}
                    </td>
                  </tr>
                ))
              ))}

              {/* SEPARATOR IF BOTH EXIST */}
              {previousOrders.length > 0 && cart.length > 0 && (
                <tr>
                   <td colSpan="3" className="bg-yellow-50 text-yellow-700 text-[10px] font-black uppercase tracking-widest text-center py-1 border-y border-yellow-100">
                     New Items (Not Sent)
                   </td>
                </tr>
              )}

              {/* 2. CURRENT CART (UNSENT) */}
              {cart.map((item) => (
                <tr key={item.variantId} className="group hover:bg-gray-50 transition-colors bg-white">
                  <td className="py-3 pl-2 pr-2 align-top">
                    <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                    <div className="space-y-0.5 mt-1">
                      {item.selectedSpice && <div className="text-[10px] text-orange-600 font-bold">🔥 {item.selectedSpice}</div>}
                      {item.selectedExtras?.map((e, idx) => <div key={idx} className="text-[10px] text-gray-500 font-medium">+ {e.label}</div>)}
                      {item.note && <div className="text-[10px] text-blue-500 italic border-l-2 border-blue-200 pl-1 mt-1">"{item.note}"</div>}
                    </div>
                    <button onClick={() => removeFromCart(item.variantId)} className="text-[10px] text-red-400 hover:text-red-600 font-bold hover:underline mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /> Remove</button>
                  </td>
                  <td className="py-3 text-center align-top pt-3">
                    <div className="flex items-center justify-center gap-1 bg-gray-100 rounded-lg p-1 inline-flex">
                      <button onClick={() => updateQty(item.variantId, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-red-500"><Minus size={12} /></button>
                      <span className="font-bold w-6 text-center text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.variantId, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-green-500"><Plus size={12} /></button>
                    </div>
                  </td>
                  <td className="py-3 pr-2 text-right font-bold text-gray-700 align-top pt-3">{(item.price * item.qty).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* EMPTY STATE */}
          {cart.length === 0 && previousOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-300">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2"><Grid size={24} className="opacity-20" /></div>
              <p className="italic text-sm">Table is empty</p>
            </div>
          )}
        </div>

        {/* Footer (Actions for Current Order) */}
        <div className="p-4 bg-gray-50 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <div className="flex justify-between items-end mb-4 px-1">
            <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">New Items Total</span>
            <span className="text-2xl font-black text-gray-900">Ksh {cartTotal.toLocaleString()}</span>
          </div>
          <button onClick={handlePlaceOrder} disabled={cart.length === 0} className="w-full bg-green-600 text-white py-4 rounded-xl shadow-lg font-bold text-lg uppercase hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
            <Send size={20} /> Send to Kitchen
          </button>
        </div>
      </div>

      {/* MODALS */}
      {selectedItemForModal && <POSItemModal item={selectedItemForModal} onClose={() => setSelectedItemForModal(null)} onConfirm={handleModalConfirm} />}
      {showBillModal && <TableBillModal orders={previousOrders} currentCart={cart} tableId={tableId} tableName={tableName} onClose={() => setShowBillModal(false)} onPay={handlePayment} />}

    </div>
  );
};

export default POS;






















/*import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../components/firebase';
import POSItemModal from './POSItemModal'; 
import { 
  ChevronLeft, 
  Send, 
  Plus, 
  Minus,
  Search,
  Grid,
  Trash2,
  Utensils
} from 'lucide-react';

// --- COLOR MAPPING ---
const CATEGORY_COLORS = {
  "BREAKFAST": "bg-yellow-600",
  "BEEF": "bg-blue-600",
  "CHICKEN": "bg-green-700",
  "FISH": "bg-pink-600",
  "DRINKS": "bg-orange-600",
  "ALCOHOL": "bg-yellow-500",
  "SOUPS": "bg-yellow-400",
  "SALADS": "bg-blue-500",
  "WINES": "bg-pink-500",
  "WHISKEY": "bg-green-800",
  "DEFAULT": ["bg-teal-600", "bg-indigo-600", "bg-purple-600", "bg-red-600"]
};

const POS = () => {
  const { tableId, tableName } = useParams();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [categories, setCategories] = useState([]); 
  const [items, setItems] = useState([]);           
  const [cart, setCart] = useState([]);
  
  // Filter States
  const [activeCategoryId, setActiveCategoryId] = useState("All"); 
  const [searchQuery, setSearchQuery] = useState("");
  
  // System States
  const [waiter, setWaiter] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);

  // --- 1. AUTH CHECK ---
  useEffect(() => {
    const w = localStorage.getItem('currentWaiter');
    if (!w) navigate('/waiter/login');
    else setWaiter(JSON.parse(w));
  }, [navigate]);

  // --- 2. FETCH DATA ---
  useEffect(() => {
    // Fetch Active Categories
    const catQuery = query(collection(db, "categories"), orderBy("name", "asc"));
    const unsubCats = onSnapshot(catQuery, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Available Items
    const itemQuery = query(collection(db, "menuItems"), where("available", "==", true));
    const unsubItems = onSnapshot(itemQuery, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsubCats(); unsubItems(); };
  }, []);

  // --- 3. FILTER LOGIC ---
  const filteredItems = items.filter(item => {
    // Global Search
    if (searchQuery) return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Category Filter (ID Match)
    if (activeCategoryId === "All") return true;
    return item.categoryId === activeCategoryId;
  });

  // --- 4. CART LOGIC ---
  
  // A. Trigger Add (Check if Modal needed)
  const addToCart = (item) => {
    const needsModal = item.hasSpiceLevels || (item.extras && item.extras.length > 0);

    if (needsModal) {
      setSelectedItemForModal(item);
    } else {
      // Direct Add for simple items
      const simpleItem = { 
        ...item, 
        qty: 1, 
        variantId: item.id, 
        price: Number(item.price) 
      };
      
      setCart(prev => {
        const existing = prev.find(i => i.variantId === simpleItem.variantId);
        if (existing) {
          return prev.map(i => i.variantId === simpleItem.variantId ? { ...i, qty: i.qty + 1 } : i);
        }
        return [...prev, simpleItem];
      });
    }
  };

  // B. Handle Confirm from Modal
  const handleModalConfirm = (configuredItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.variantId === configuredItem.variantId);
      if (existing) {
        return prev.map(i => i.variantId === configuredItem.variantId ? { 
          ...i, 
          qty: i.qty + configuredItem.qty 
        } : i);
      }
      return [...prev, configuredItem];
    });
    setSelectedItemForModal(null);
  };

  // C. Update / Remove
  const updateQty = (variantId, change) => {
    setCart(prev => prev.map(item => {
      if (item.variantId === variantId) {
        return { ...item, qty: Math.max(1, item.qty + change) };
      }
      return item;
    }));
  };

  const removeFromCart = (variantId) => {
    setCart(prev => prev.filter(i => i.variantId !== variantId));
  };

  const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  // --- 5. SUBMIT ORDER ---
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      await addDoc(collection(db, "orders"), {
        tableId, 
        tableName, 
        waiterId: waiter.id, 
        waiterName: waiter.name,
        items: cart, 
        totalAmount: cartTotal, 
        status: "pending", 
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "tables", tableId), { status: "occupied" });
      navigate('/waiter/tables');
    } catch (err) { alert("Error sending order"); }
  };

  // Helper: Colors
  const getCategoryColor = (catName, index) => {
    if (catName === "All") return "bg-gray-800";
    const upper = catName.toUpperCase();
    if (CATEGORY_COLORS[upper]) return CATEGORY_COLORS[upper];
    // Partial Match
    const partialKey = Object.keys(CATEGORY_COLORS).find(k => upper.includes(k));
    if (partialKey) return CATEGORY_COLORS[partialKey];
    // Default
    return CATEGORY_COLORS.DEFAULT[index % CATEGORY_COLORS.DEFAULT.length];
  };

  // Helper: Count
  const getItemCount = (catId) => {
    if (catId === "All") return items.length;
    return items.filter(i => i.categoryId === catId).length;
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">Loading POS...</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      
     
      {/* LEFT COL: CATEGORIES & ITEMS            *//*
     
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
       
        <div className="bg-white border-b p-2 flex items-center justify-between h-14 shrink-0 shadow-sm z-20 relative">
          <button onClick={() => navigate('/waiter/tables')} className="flex items-center gap-1 text-gray-600 font-bold px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
            <ChevronLeft size={18} /> Tables
          </button>
          
          <div className="relative w-1/2">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
            />
          </div>
          <div className="w-20"></div>
        </div>

        {/* Categories (Top Half) *//*
        <div className="h-[50%] bg-white p-2 overflow-y-auto border-b-4 border-gray-200">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            
            {/* ALL MENU Button *//*
            <button
              onClick={() => { setActiveCategoryId("All"); setSearchQuery(""); }}
              className={`p-4 rounded-xl shadow-sm text-left font-bold text-xs md:text-sm uppercase text-white transition-all active:scale-95
                bg-gray-800 
                ${activeCategoryId === "All" ? "ring-4 ring-black scale-105 z-10 shadow-xl" : "opacity-90 hover:opacity-100"}
              `}
            >
              ALL MENU
              <div className="text-[10px] font-normal opacity-70 mt-1 lowercase">
                {items.length} items
              </div>
            </button>

            {/* Dynamic Categories *//*
            {categories.map((cat, idx) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategoryId(cat.id); setSearchQuery(""); }}
                className={`p-4 rounded-xl shadow-sm text-left font-bold text-xs md:text-sm uppercase text-white transition-all active:scale-95 break-words
                  ${getCategoryColor(cat.name, idx)}
                  ${activeCategoryId === cat.id ? "ring-4 ring-black scale-105 z-10 shadow-xl" : "opacity-90 hover:opacity-100"}
                `}
              >
                {cat.name}
                <div className="text-[10px] font-normal opacity-70 mt-1 lowercase">
                  {getItemCount(cat.id)} items
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Items (Bottom Half) *//*
        <div className="flex-1 bg-gray-100 p-2 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Grid size={48} className="opacity-20 mb-2" />
              <p>No items found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pb-20">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-white p-3 rounded-xl shadow-sm border border-transparent hover:border-green-500 active:bg-green-50 flex flex-col justify-between h-32 text-left transition-all relative overflow-hidden group"
                >
                  {/* Image *//*
                  {item.imageUrl && (
                    <div className="absolute top-0 right-0 w-12 h-12 bg-gray-100 rounded-bl-2xl">
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover rounded-bl-2xl opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}

                  <span className="font-bold text-gray-800 text-xs md:text-sm leading-tight line-clamp-2 z-10 pr-8">
                    {item.name}
                  </span>
                  
                  {/* Category Label *//*
                  {activeCategoryId === "All" && (
                    <span className="text-[9px] text-gray-400 uppercase tracking-tighter font-bold">
                      {categories.find(c => c.id === item.categoryId)?.name}
                    </span>
                  )}

                  <div className="flex justify-between items-end w-full z-10 mt-auto">
                    <span className="text-green-700 font-black text-sm">
                      {Number(item.price).toLocaleString()}
                    </span>
                    {/* Badge for Options *//*
                    {(item.hasSpiceLevels || (item.extras && item.extras.length > 0)) && (
                      <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                        Options
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

     
      {/* RIGHT COL: CART                         *//*
      
      <div className="w-[380px] bg-white border-l shadow-2xl flex flex-col z-30 shrink-0">
        
        <div className="p-4 bg-gray-50 border-b shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl font-black text-gray-800 uppercase">Table {tableName}</h2>
            <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
              {waiter?.name}
            </span>
          </div>
        </div>

        {/* Cart List *//*
        <div className="flex-1 overflow-y-auto p-2">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-gray-400 uppercase border-b bg-white sticky top-0">
              <tr>
                <th className="py-2 pl-2">Item</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right pr-2">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cart.map((item) => (
                <tr key={item.variantId} className="group hover:bg-gray-50 transition-colors">
                  <td className="py-3 pl-2 pr-2 align-top">
                    <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                    
                    {/* Display Options/Notes *//*
                    
                    <div className="space-y-0.5 mt-1">
                      {item.selectedSpice && (
                     <div className="text-[10px] text-orange-600 font-bold flex items-center gap-1">
                    🔥 {item.selectedSpice}
                     </div>
                     )}
                    {/* UPDATE THIS SECTION for Extra Labels *//*
                    {item.selectedExtras?.map((e, idx) => (
                   <div key={idx} className="text-[10px] text-gray-500 font-medium">
                   + {e.label}  
                  </div>
                    ))}
                  {item.note && (
                   <div className="text-[10px] text-blue-500 italic border-l-2 border-blue-200 pl-1 mt-1">
                  "{item.note}"
                   </div>
                      )}
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.variantId)} 
                      className="text-[10px] text-red-400 hover:text-red-600 font-bold hover:underline mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={10} /> Remove
                    </button>
                  </td>
                  
                  <td className="py-3 text-center align-top pt-3">
                    <div className="flex items-center justify-center gap-1 bg-gray-100 rounded-lg p-1 inline-flex">
                      <button onClick={() => updateQty(item.variantId, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-red-500 hover:shadow"><Minus size={12} /></button>
                      <span className="font-bold w-6 text-center text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.variantId, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-green-500 hover:shadow"><Plus size={12} /></button>
                    </div>
                  </td>
                  
                  <td className="py-3 pr-2 text-right font-bold text-gray-700 align-top pt-3">
                    {(item.price * item.qty).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-300">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                <Utensils size={24} className="opacity-20" />
              </div>
              <p className="italic text-sm">Order is empty</p>
            </div>
          )}
        </div>

        {/* Footer *//*
        <div className="p-4 bg-gray-50 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <div className="flex justify-between items-end mb-4 px-1">
            <span className="text-gray-500 font-bold text-sm uppercase tracking-wider">Total Amount</span>
            <span className="text-2xl font-black text-gray-900">Ksh {cartTotal.toLocaleString()}</span>
          </div>
          <button 
            onClick={handlePlaceOrder} 
            disabled={cart.length === 0} 
            className="w-full bg-green-600 text-white py-4 rounded-xl shadow-lg font-bold text-lg uppercase hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            <Send size={20} /> Send to Kitchen
          </button>
        </div>
      </div>

    
      {selectedItemForModal && (
        <POSItemModal 
          item={selectedItemForModal} 
          onClose={() => setSelectedItemForModal(null)} 
          onConfirm={handleModalConfirm} 
        />
      )}

    </div>
  );
};

export default POS;*/
