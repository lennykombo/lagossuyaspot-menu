import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ChefHat, Bike, CheckSquare, House, Loader2 } from 'lucide-react';

const OrderTracker = ({ orderId }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    // Listen to Firebase for status changes
    const unsub = onSnapshot(doc(db, "orders", orderId), (docSnap) => {
      if (docSnap.exists()) {
        // Ensure we handle case-sensitivity (pending vs Pending)
        setStatus(docSnap.data().status?.toLowerCase() || 'pending');
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [orderId]);

  // Steps that match your OrdersManager (Admin) buttons
  const steps = [
    { id: 'pending', label: 'Confirmed', icon: <CheckSquare size={20} /> },
    { id: 'preparing', label: 'Cooking', icon: <ChefHat size={20} /> },
    { id: 'ready', label: 'Ready for Pickup', icon: <Bike size={20} /> }, 
    { id: 'completed', label: 'Rider on the way. Enjoy!', icon: <House size={20} /> },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center py-10 gap-2">
        <Loader2 className="animate-spin text-orange-500" />
        <p className="text-sm text-gray-400">Updating status...</p>
      </div>
    );
  }

  const getStatusIndex = () => steps.findIndex(s => s.id === status);

  return (
    <div className="relative">
      {/* Vertical Progress Line */}
      <div className="absolute left-8 top-0 h-full w-0.5 bg-gray-100"></div>

      <div className="space-y-8 relative">
        {steps.map((step, index) => {
          const isCompleted = index <= getStatusIndex();
          const isCurrent = index === getStatusIndex();

          return (
            <div key={step.id} className="flex items-center gap-6">
              {/* Icon Circle */}
              <div className={`z-10 flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-500 ${
                isCompleted 
                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200' 
                : 'bg-white border-gray-100 text-gray-300'
              }`}>
                {step.icon}
              </div>
              
              {/* Text Label */}
              <div>
                <p className={`font-bold text-lg leading-tight ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-sm text-orange-600 font-medium animate-pulse mt-1">
                    {status === 'pending' && "Waiting for kitchen..."}
                    {status === 'preparing' && "Chef is preparing your meal..."}
                    {status === 'ready' && "Food is ready! Sendeing rider"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracker;