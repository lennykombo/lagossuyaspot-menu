import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../components/firebase';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import WaiterNotificationWidget from './WaiterNotificationWidget';

const FloorPlan = () => {
  const [sections, setSections] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [waiter, setWaiter] = useState(null);
  const navigate = useNavigate();

  // 1. Check Auth
  useEffect(() => {
    const saved = localStorage.getItem('currentWaiter');
    if (!saved) navigate('/waiter/login');
    setWaiter(JSON.parse(saved));
  }, [navigate]);

  // 2. Fetch Sections
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "sections"), orderBy("name")), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSections(data);
      if (data.length > 0 && !activeSectionId) setActiveSectionId(data[0].id);
    });
    return () => unsub();
  }, [activeSectionId]);

  // 3. Fetch Tables (Real-time)
  useEffect(() => {
    if (!activeSectionId) return;
    const q = query(collection(db, "tables"), where("sectionId", "==", activeSectionId));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort numerically/alphabetically
      data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      setTables(data);
    });
    return () => unsub();
  }, [activeSectionId]);

  const handleLogout = () => {
    localStorage.removeItem('currentWaiter');
    navigate('/waiter/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <WaiterNotificationWidget/>
      {/* Header */}
      <div className="bg-green-700 text-white p-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-bold">LagosSuya POS</h1>
          <p className="text-xs opacity-80">Logged in as: {waiter?.name}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-green-800 px-4 py-2 rounded-lg text-sm">
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm p-2 flex gap-4 overflow-x-auto">
        {sections.map(sec => (
          <button
            key={sec.id}
            onClick={() => setActiveSectionId(sec.id)}
            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-colors
              ${activeSectionId === sec.id 
                ? 'bg-green-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
            `}
          >
            {sec.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => navigate(`/waiter/pos/${table.id}/${table.name}`)}
              className={`
                h-40 rounded-3xl shadow-sm border-2 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95
                ${table.status === 'occupied' 
                  ? 'bg-red-50 border-red-200 text-red-600' // Busy Style
                  : 'bg-white border-green-100 text-gray-700 hover:border-green-500'} // Free Style
              `}
            >
              <span className="text-3xl font-black">{table.name}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                ${table.status === 'occupied' ? 'bg-red-200' : 'bg-green-100 text-green-700'}
              `}>
                {table.status === 'occupied' ? 'Busy' : 'Free'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloorPlan;