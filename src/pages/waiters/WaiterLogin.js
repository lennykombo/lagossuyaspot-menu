import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../components/firebase';
import { useNavigate } from 'react-router-dom';
import { User, Calculator, Delete, Loader2, ChevronLeft } from 'lucide-react';

const WaiterLogin = () => {
  const [waiters, setWaiters] = useState([]);
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Fetch Waiters
  useEffect(() => {
    const fetchWaiters = async () => {
      try {
        const snap = await getDocs(collection(db, "waiters"));
        setWaiters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load staff", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWaiters();
  }, []);

  // 2. Auto-Login when PIN is 4 digits
  useEffect(() => {
    if (pin.length === 4) {
      handleLogin(pin);
    }
  }, [pin]);

  const handleLogin = (currentPin) => {
    if (!selectedWaiter) return;
    
    // Check PIN (Ensure both are strings for comparison)
    if (String(currentPin) === String(selectedWaiter.pin)) {
      localStorage.setItem('currentWaiter', JSON.stringify(selectedWaiter));
      navigate('/waiter/tables');
    } else {
      setError("Incorrect PIN");
      setPin(""); // Reset nicely
      
      // Vibration feedback for mobile devices (if supported)
      if (navigator.vibrate) navigator.vibrate(200);
    }
  };

  const handleNumClick = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError("");
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError("");
  };

  // Get time of day for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <Loader2 className="animate-spin mr-2" /> Loading Staff...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-w-5xl w-full h-[650px]">
        
        {/* LEFT: Waiter Selection */}
        <div className={`
          w-full md:w-1/2 bg-gray-50 p-6 border-r overflow-y-auto transition-all duration-300
          ${selectedWaiter ? 'hidden md:block opacity-50 pointer-events-none' : 'opacity-100'}
        `}>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-gray-800">Team Login</h2>
            <p className="text-gray-500">{getGreeting()}! Who is working?</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {waiters.map(waiter => (
              <button
                key={waiter.id}
                onClick={() => { setSelectedWaiter(waiter); setPin(""); setError(""); }}
                className="group relative p-6 bg-white border-2 border-gray-100 rounded-2xl shadow-sm hover:border-green-500 hover:shadow-md transition-all flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 group-hover:bg-green-100 group-hover:text-green-700 transition-colors">
                  {waiter.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-gray-700 group-hover:text-green-700">{waiter.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: PIN Pad */}
        <div className="w-full md:w-1/2 bg-white flex flex-col relative">
          
          {selectedWaiter ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in slide-in-from-right duration-300">
              
              {/* Back Button (Mobile friendly) */}
              <button 
                onClick={() => setSelectedWaiter(null)}
                className="absolute top-6 left-6 flex items-center gap-1 text-gray-400 hover:text-gray-800 font-bold text-sm"
              >
                <ChevronLeft size={20} /> Back
              </button>

              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center text-3xl font-black text-green-700 mb-4 shadow-inner">
                  {selectedWaiter.name.charAt(0)}
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Hello, {selectedWaiter.name}</h3>
                <p className="text-gray-400 text-sm">Enter your 4-digit PIN</p>
              </div>
              
              {/* PIN Dots */}
              <div className="flex gap-4 mb-8 h-8">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full transition-all duration-200 
                      ${i < pin.length ? 'bg-green-600 scale-110' : 'bg-gray-200'}
                      ${error ? 'bg-red-500 animate-shake' : ''}
                    `} 
                  />
                ))}
              </div>

              {error && <p className="text-red-500 font-bold mb-4 animate-bounce">{error}</p>}

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button 
                    key={num} 
                    onClick={() => handleNumClick(num.toString())}
                    className="h-16 rounded-2xl bg-gray-50 border border-gray-100 text-2xl font-bold text-gray-700 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 transition-all hover:bg-gray-100"
                  >
                    {num}
                  </button>
                ))}
                
                {/* Empty Spacer or 00 */}
                <div className="h-16"></div>

                <button 
                  onClick={() => handleNumClick("0")} 
                  className="h-16 rounded-2xl bg-gray-50 border border-gray-100 text-2xl font-bold text-gray-700 shadow-[0_4px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 transition-all hover:bg-gray-100"
                >
                  0
                </button>

                <button 
                  onClick={handleBackspace} 
                  className="h-16 rounded-2xl bg-red-50 border border-red-100 text-red-500 flex items-center justify-center shadow-[0_4px_0_0_rgba(239,68,68,0.1)] active:shadow-none active:translate-y-1 transition-all hover:bg-red-100"
                >
                  <Delete size={24} />
                </button>
              </div>
            </div>
          ) : (
            // Empty State (When no waiter selected)
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-8">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Calculator size={40} className="opacity-20 text-gray-900" />
              </div>
              <p className="font-medium">Select your profile from the list to login.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiterLogin;