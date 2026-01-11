import React from 'react';
import { ChefHat, Bike, CheckSquare, House } from 'lucide-react';

// 1. Accept 'status' directly as a prop. 
// We don't need 'orderId' because the parent already fetched the data.
const OrderTracker = ({ status }) => {
  
  // Normalize status to ensure 'Paid' matches 'paid'
  const currentStatus = status ? status.toLowerCase() : 'pending';

  // 2. Define the Progress Logic
  // We list the statuses in order. 
  // If currentStatus is 'preparing', then 'paid' is also considered done.
  const statusHierarchy = ['pending', 'paid', 'preparing', 'ready', 'completed'];
  
  const getCurrentStepIndex = () => {
    return statusHierarchy.indexOf(currentStatus);
  };

  const currentStepIndex = getCurrentStepIndex();

  // 3. Define the Visual Steps
  // Note: We map 'paid' to the first step "Confirmed"
  const steps = [
    { 
      id: 'paid', // "paid" triggers this step
      label: 'Confirmed', 
      icon: <CheckSquare size={20} />,
      threshold: 1 // This step is active if status index is >= 1
    },
    { 
      id: 'preparing', 
      label: 'Cooking', 
      icon: <ChefHat size={20} />,
      threshold: 2 // This step is active if status index is >= 2
    },
    { 
      id: 'ready', 
      label: 'Ready for Pickup', 
      icon: <Bike size={20} />, 
      threshold: 3 
    }, 
    { 
      id: 'completed', 
      label: 'Rider on the way', 
      icon: <House size={20} />, 
      threshold: 4 
    },
  ];

  return (
    <div className="relative">
      {/* Vertical Progress Line */}
      <div className="absolute left-8 top-0 h-full w-0.5 bg-gray-100"></div>

      <div className="space-y-8 relative">
        {steps.map((step, index) => {
          // Check if this step is completed based on the hierarchy
          const isCompleted = currentStepIndex >= step.threshold;
          
          // Check if this is the CURRENT active step
          // (e.g. if status is 'paid', index is 1, threshold is 1 -> Current)
          const isCurrent = currentStepIndex === step.threshold;

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
                
                {/* Dynamic Status Text */}
                {isCurrent && (
                  <p className="text-sm text-orange-600 font-medium animate-pulse mt-1">
                    {currentStatus === 'paid' && "Waiting for kitchen to accept..."}
                    {currentStatus === 'preparing' && "Chef is preparing your meal..."}
                    {currentStatus === 'ready' && "Food is packed and ready!"}
                    {currentStatus === 'completed' && "Enjoy your meal!"}
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


















/*import React, { useEffect, useState } from 'react';
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
      {/* Vertical Progress Line *//*
      <div className="absolute left-8 top-0 h-full w-0.5 bg-gray-100"></div>

      <div className="space-y-8 relative">
        {steps.map((step, index) => {
          const isCompleted = index <= getStatusIndex();
          const isCurrent = index === getStatusIndex();

          return (
            <div key={step.id} className="flex items-center gap-6">
      
              <div className={`z-10 flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-500 ${
                isCompleted 
                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200' 
                : 'bg-white border-gray-100 text-gray-300'
              }`}>
                {step.icon}
              </div>
              
          
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

export default OrderTracker;*/