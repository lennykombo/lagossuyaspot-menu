import React from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutForm from '../components/Checkout/CheckoutForm';
import CartSummary from '../components/Cart/CartSummary';

const CheckoutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-yellow-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 px-4 py-4 flex items-center">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-4 text-gray-600 p-1"
        >
          ✕
        </button>
        <h1 className="text-xl font-bold">Checkout</h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: The Form */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Delivery Details</h2>
            <CheckoutForm />
          </div>

          {/* Right Side: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Your Order Summary</h2>
              <CartSummary />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
