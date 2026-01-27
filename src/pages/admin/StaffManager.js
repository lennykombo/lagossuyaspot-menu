import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../components/firebase';
import { Users, Trash2, Plus, Calculator } from 'lucide-react';

const StaffManager = () => {
  const [waiters, setWaiters] = useState([]);
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Fetch Waiters
  useEffect(() => {
    const q = query(collection(db, "waiters"), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      setWaiters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Add Waiter
  const handleAddWaiter = async (e) => {
    e.preventDefault();
    if (!newName || newPin.length < 4) {
      alert("Name required and PIN must be 4 digits");
      return;
    }

    try {
      await addDoc(collection(db, "waiters"), {
        name: newName,
        pin: newPin, // Storing as simple string for easy matching
        role: "waiter",
        createdAt: new Date()
      });
      setNewName("");
      setNewPin("");
    } catch (err) {
      console.error("Error adding staff:", err);
    }
  };

  // 3. Delete Waiter
  const handleDelete = async (id) => {
    if (window.confirm("Remove this staff member?")) {
      await deleteDoc(doc(db, "waiters", id));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
        <p className="text-gray-500">Create login PINs for your waiters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Add New Staff Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={20} className="text-green-600" /> Add New Staff
          </h2>
          <form onSubmit={handleAddWaiter} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
              <input 
                type="text" 
                placeholder="e.g. Alice"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Login PIN (4 Digits)</label>
              <div className="relative">
                <Calculator className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  maxLength="4"
                  placeholder="0000"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} // Only numbers
                  className="w-full mt-1 pl-10 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500 font-mono tracking-widest font-bold"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition">
              Create Account
            </button>
          </form>
        </div>

        {/* RIGHT: Staff List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Users size={20} /> Active Team ({waiters.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waiters.map(waiter => (
              <div key={waiter.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xl">
                    {waiter.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{waiter.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">PIN: ••••</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(waiter.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            {waiters.length === 0 && !loading && (
              <p className="text-gray-400 italic">No staff added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManager;