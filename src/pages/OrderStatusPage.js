import React from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Utensils, ShoppingBag, Clock } from "lucide-react"; 
import OrderTracker from '../components/OrderTracker';


const OrderStatusPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const orderTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-orange-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Order Received!</h1>
          <p className="mt-2 text-gray-600">
            We've sent your order to the kitchen.
          </p>
          <div className="mt-4 inline-block bg-white px-4 py-1 rounded-full border border-orange-100 text-sm font-medium text-orange-700">
            Order ID: #{orderId.slice(-6).toUpperCase()}
          </div>
        </div>

        {/* Food Tracker Card */}
        <div className="bg-white shadow-xl rounded-3xl overflow-hidden border border-orange-100">
          <div className="p-6 border-b border-gray-50 bg-orange-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <Utensils className="h-5 w-5 text-orange-500" />
              Order Progress
            </h2>
            <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
              <Clock className="h-4 w-4" />
              Ordered at {orderTime}
            </div>
          </div>
          
          <div className="p-8">
            {/* The specialized Food Tracker */}
            <OrderTracker orderId={orderId} />
          </div>
          
          <div className="p-6 bg-gray-50 text-center">
            <p className="text-sm text-gray-500">
              Need to change something? <span className="text-orange-600 font-semibold cursor-pointer">Call Restaurant</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
          >
            <ShoppingBag className="h-5 w-5" />
            Order More Food
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage;











/*import React from 'react'
import { useParams } from "react-router-dom";
import OrderTracker from '../components/Order/OrderTracker'

const OrderStatusPage = () => {

     const { orderId } = useParams();
     
  return (
     <div className="order-status-page">
      <OrderTracker orderId={orderId} />
    </div>
  )
}

export default OrderStatusPage*/