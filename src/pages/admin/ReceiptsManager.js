import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../components/firebase';
import { Receipt, Calendar, User, Eye, Phone, Utensils, ShoppingBag, CheckCircle, Clock } from 'lucide-react';

const ReceiptsManager = () => {
  // --- RAW DATA ---
  const [receipts, setReceipts] = useState([]);           // Paid Dine-In
  const [activeInHouse, setActiveInHouse] = useState([]); // Unpaid Dine-In
  const [takeawayOrders, setTakeawayOrders] = useState([]); // All Takeaway

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState('dine-in'); // 'dine-in' | 'takeaway'
  const [selectedItem, setSelectedItem] = useState(null);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // 1. DINE-IN (Paid Receipts)
    const unsubReceipts = onSnapshot(query(collection(db, "receipts"), orderBy("createdAt", "desc")), (snap) => {
      setReceipts(snap.docs.map(d => ({ 
        id: d.id, ...d.data(), isPaid: true, type: 'dine-in',
        dateObj: d.data().createdAt?.toDate() || new Date()
      })));
    });

    // 2. DINE-IN (Active/Pending)
    const unsubInHouse = onSnapshot(query(collection(db, "inhouseorders"), where("status", "!=", "completed")), (snap) => {
      setActiveInHouse(snap.docs
        .map(d => ({ 
          id: d.id, ...d.data(), isPaid: false, type: 'dine-in',
          dateObj: d.data().createdAt?.toDate() || new Date()
        }))
        .filter(o => o.status !== 'cancelled')
      );
    });

    // 3. TAKEAWAY (All)
    const unsubTakeaway = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
      setTakeawayOrders(snap.docs.map(d => ({ 
        id: d.id, ...d.data(), type: 'takeaway',
        // In takeaway, 'pending' means unpaid. 'paid', 'preparing', 'ready', 'completed' usually imply payment received or guaranteed.
        isPaid: d.data().status !== 'pending', 
        dateObj: d.data().createdAt?.toDate() || new Date()
      })));
    });

    return () => { unsubReceipts(); unsubInHouse(); unsubTakeaway(); };
  }, []);

  // --- PREPARE DATA LISTS ---

  // 1. DINE-IN LIST (Filtered by Date for Receipts, Show ALL Pending)
  const dineInList = [
    ...activeInHouse, // Always show pending tables regardless of date
    ...receipts.filter(r => r.dateObj.toISOString().split('T')[0] === dateFilter)
  ].sort((a, b) => b.dateObj - a.dateObj);

  // 2. TAKEAWAY LIST (Filtered by Date for Completed, Show ALL Pending)
  const takeawayList = takeawayOrders.filter(t => {
      if (!t.isPaid) return true; // Show all pending
      return t.dateObj.toISOString().split('T')[0] === dateFilter; // Show only today's paid
  }).sort((a, b) => b.dateObj - a.dateObj);

  // --- DETERMINE CURRENT VIEW ---
  const currentList = activeTab === 'dine-in' ? dineInList : takeawayList;

  // --- CALCULATE TOTALS FOR CURRENT VIEW ---
  const collectedTotal = currentList.filter(i => i.isPaid).reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  const pendingTotal = currentList.filter(i => !i.isPaid).reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  const grandTotal = collectedTotal + pendingTotal;

  return (
    <div className="space-y-6 h-[calc(100vh-2rem)] flex flex-col">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col xl:flex-row justify-between items-end gap-4 border-b pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Receipt className="text-blue-600" /> Sales & Orders
          </h1>
          <p className="text-gray-500 text-sm">Select a department to view details.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
             {/* Date Picker */}
             <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border shadow-sm">
                <Calendar size={16} className="text-gray-400"/>
                <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                  className="outline-none text-sm text-gray-700 font-bold bg-transparent" />
            </div>

            {/* DYNAMIC METRICS (Changes based on Tab) */}
            <div className={`flex rounded-xl shadow-sm border overflow-hidden divide-x ${activeTab === 'dine-in' ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                <div className="px-4 py-2">
                    <span className={`text-[10px] font-bold uppercase block ${activeTab === 'dine-in' ? 'text-blue-600' : 'text-orange-600'}`}>
                        {activeTab === 'dine-in' ? 'Dine-In Collected' : 'Takeaway Paid'}
                    </span>
                    <span className="text-lg font-black text-gray-800">Ksh {collectedTotal.toLocaleString()}</span>
                </div>
                <div className="px-4 py-2 bg-white/50">
                    <span className="text-[10px] text-red-500 font-bold uppercase block">Pending</span>
                    <span className="text-lg font-black text-red-600">Ksh {pendingTotal.toLocaleString()}</span>
                </div>
                <div className="px-4 py-2 bg-gray-800 text-white">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Total</span>
                    <span className="text-lg font-black">Ksh {grandTotal.toLocaleString()}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* --- LEFT COLUMN: LIST --- */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          
          {/* MAIN TABS */}
          <div className="flex border-b">
            <button 
                onClick={() => { setActiveTab('dine-in'); setSelectedItem(null); }}
                className={`flex-1 py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                ${activeTab === 'dine-in' ? 'bg-white text-blue-600 border-b-4 border-blue-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
                <Utensils size={16} /> Dine-In Items
            </button>
            <button 
                onClick={() => { setActiveTab('takeaway'); setSelectedItem(null); }}
                className={`flex-1 py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                ${activeTab === 'takeaway' ? 'bg-white text-orange-600 border-b-4 border-orange-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
                <ShoppingBag size={16} /> Takeaway Orders
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold sticky top-0 z-10">
                  <tr>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">
                          {activeTab === 'dine-in' ? 'Table & Waiter' : 'Customer & Phone'}
                      </th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3 text-center">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {currentList.length === 0 ? (
                    <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">No records found for this view.</td></tr>
                ) : (
                    currentList.map(item => (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedItem?.id === item.id ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4">
                           {item.isPaid ? (
                               <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded w-fit uppercase">
                                 <CheckCircle size={10} /> Paid
                               </span>
                           ) : (
                               <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded w-fit uppercase animate-pulse">
                                 <Clock size={10} /> Pending
                               </span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                           {item.dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                            {activeTab === 'dine-in' ? (
                                <div>
                                    <div className="font-bold text-gray-800 text-sm">Table {item.tableName}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1"><User size={10} /> {item.waiterName}</div>
                                </div>
                            ) : (
                                <div>
                                    <div className="font-bold text-gray-800 text-sm">{item.customerName || "Walk-in"}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} /> {item.phone || "N/A"}</div>
                                </div>
                            )}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${item.isPaid ? 'text-gray-700' : 'text-red-600'}`}>
                            {Number(item.totalAmount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <button onClick={() => setSelectedItem(item)} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Eye size={18} /></button>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
          </div>
        </div>

        {/* --- RIGHT COLUMN: PREVIEW --- */}
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-6 flex flex-col h-full overflow-hidden">
          {selectedItem ? (
            <>
              {/* Dynamic Receipt Header Color */}
              <div className={`text-center border-b border-gray-200 pb-4 mb-4 border-dashed -mx-6 px-6 pt-6 -mt-6 rounded-t-2xl
                 ${!selectedItem.isPaid ? 'bg-red-50' : (activeTab === 'takeaway' ? 'bg-orange-50' : 'bg-blue-50')}
              `}>
                <h3 className="text-xl font-black uppercase text-gray-800">LagosSuya</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                    {selectedItem.isPaid ? 'Official Receipt' : 'Provisional Bill'}
                </p>
                {!selectedItem.isPaid && <div className="mt-2 text-[10px] text-red-600 font-bold bg-red-100 inline-block px-2 py-1 rounded">NOT PAID</div>}
              </div>

              <div className="flex justify-between text-sm mb-4 text-gray-600 font-bold">
                {activeTab === 'dine-in' ? (
                   <><span>Table: {selectedItem.tableName}</span><span>Svr: {selectedItem.waiterName}</span></>
                ) : (
                   <><span>Client: {selectedItem.customerName}</span><span>{selectedItem.phone}</span></>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
                {selectedItem.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-gray-200 pb-2 last:border-0">
                    <div>
                      <span className="font-bold mr-2">{item.qty}x</span> <span className="text-gray-700">{item.name}</span>
                      {item.selectedExtras?.length > 0 && (
                        <div className="text-[10px] text-gray-400 pl-6">+ {item.selectedExtras.map(e => e.label || e.name).join(', ')}</div>
                      )}
                    </div>
                    <div className="font-mono text-gray-500">{(item.price * item.qty).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-800 pt-4 flex justify-between items-end">
                <span className="text-sm font-bold text-gray-600">Total {selectedItem.isPaid ? 'Paid' : 'Due'}</span>
                <span className={`text-2xl font-black ${!selectedItem.isPaid ? 'text-red-600' : 'text-gray-900'}`}>
                    Ksh {Number(selectedItem.totalAmount).toLocaleString()}
                </span>
              </div>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
               {activeTab === 'dine-in' ? <Utensils size={48} className="opacity-20 mb-2"/> : <ShoppingBag size={48} className="opacity-20 mb-2"/>}
               <p className="text-sm">Select an item</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptsManager;










/*import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../components/firebase';
import { Receipt, Calendar, User, Eye, ArrowUpRight } from 'lucide-react';

const ReceiptsManager = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  // Date Filter (Default to today)
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Basic Query: Fetch all receipts ordered by date
    // (In a real app, you would add a 'where' clause for date filtering here to save reads)
    const q = query(collection(db, "receipts"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        // Convert Timestamp to Date object safely
        dateObj: d.data().createdAt?.toDate() || new Date()
      }));
      setReceipts(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Filter Logic (Client side for now)
  const filteredReceipts = receipts.filter(r => {
    const rDate = r.dateObj.toISOString().split('T')[0];
    return rDate === dateFilter;
  });

  // Calculate Tally
  const dailyTotal = filteredReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header & Tally *//*
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Receipt className="text-blue-600" /> Sales & Receipts
          </h1>
          <p className="text-gray-500">Reconcile payments against kitchen tickets</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 px-3">
             <Calendar size={18} className="text-gray-400"/>
             <input 
               type="date" 
               value={dateFilter}
               onChange={(e) => setDateFilter(e.target.value)}
               className="outline-none text-gray-700 font-bold bg-transparent"
             />
          </div>
          <div className="bg-green-100 px-4 py-2 rounded-lg border border-green-200">
            <span className="text-xs text-green-600 font-bold uppercase block">Daily Tally</span>
            <span className="text-xl font-black text-green-800">Ksh {dailyTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LIST OF RECEIPTS *//*
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Table / Waiter</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReceipts.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-400">No receipts found for this date.</td></tr>
              ) : (
                filteredReceipts.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                      {r.dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">Table {r.tableName}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <User size={10} /> {r.waiterName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-700">
                      {r.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedReceipt(r)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* RECEIPT PREVIEW (Right Side) *//*
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-6 flex flex-col h-fit sticky top-6">
          {selectedReceipt ? (
            <>
              <div className="text-center border-b border-gray-200 pb-4 mb-4 border-dashed">
                <h3 className="text-xl font-black uppercase text-gray-800">LagosSuya</h3>
                <p className="text-xs text-gray-500">Official Receipt</p>
                <p className="text-xs text-gray-400 mt-1">ID: #{selectedReceipt.id.slice(0, 8)}</p>
              </div>

              <div className="flex justify-between text-sm mb-4 text-gray-600 font-bold">
                <span>Table: {selectedReceipt.tableName}</span>
                <span>Server: {selectedReceipt.waiterName}</span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 mb-4">
                {selectedReceipt.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-gray-200 pb-2 last:border-0">
                    <div>
                      <span className="font-bold">{item.qty}x</span> {item.name}
                      {/* Show extras if paid for *//*
                      {item.selectedExtras?.length > 0 && (
                        <div className="text-[10px] text-gray-500 pl-4">
                          + {item.selectedExtras.map(e => e.label || e.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="font-mono">{(item.price * item.qty).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-800 pt-4 flex justify-between items-end">
                <span className="text-sm font-bold text-gray-600">Total Paid</span>
                <span className="text-2xl font-black text-gray-900">Ksh {selectedReceipt.totalAmount.toLocaleString()}</span>
              </div>
              
              <div className="mt-6 text-center">
                 <button onClick={() => setSelectedReceipt(null)} className="text-sm text-gray-400 hover:text-gray-600 underline">Close Preview</button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Receipt size={48} className="mb-2 opacity-20" />
              <p className="text-sm">Select a transaction to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptsManager;*/