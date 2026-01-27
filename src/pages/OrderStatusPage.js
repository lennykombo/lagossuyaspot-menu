import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Utensils, ShoppingBag, Clock, Loader2, XCircle } from "lucide-react"; 
import OrderTracker from '../components/OrderTracker';
import { db } from '../components/firebase'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

const OrderStatusPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for Order Data
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for Payment Verification
  const [paymentStatus, setPaymentStatus] = useState(null); // 'verifying', 'success', 'failed'

  // --- 1. LIVE DATA: Listen to Firebase for status changes ---
  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = onSnapshot(doc(db, "orders", orderId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setOrder(docSnapshot.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);


  // --- 2. PAYMENT LOGIC: Handle Pesapal Redirect ---
  /*useEffect(() => {
    const verifyPayment = async () => {
      // Get the ID Pesapal put in the URL
      const trackingId = searchParams.get('OrderTrackingId');

      // Only run if we have a tracking ID and haven't verified it yet
      if (trackingId && !paymentStatus) {
        setPaymentStatus("verifying");

        try {
          // Call your Netlify Backend
          const res = await fetch(`/.netlify/functions/verify?trackingId=${trackingId}`);
          const data = await res.json();

          if (data.status === "COMPLETED") {
            // ✅ CRITICAL STEP: Update Firebase to 'paid'
            // This is what makes it appear on the Kitchen Dashboard!
            await updateDoc(doc(db, "orders", orderId), {
              status: 'paid',
              pesapalTrackingId: trackingId,
              paymentMethod: 'Pesapal'
            });
            setPaymentStatus("success");
            
            // Optional: Remove the ID from the URL so it looks clean
            setSearchParams({});
          } else {
            setPaymentStatus("failed");
            console.error("Payment not completed:", data.status);
          }
        } catch (err) {
          console.error("Verification Error:", err);
          setPaymentStatus("failed");
        }
      }
    };

    verifyPayment();
  }, [searchParams, orderId, paymentStatus, setSearchParams]);*/

  // --- 2. PAYMENT LOGIC: Handle Pesapal Redirect ---
  useEffect(() => {
    const verifyPayment = async () => {
      // Get the ID Pesapal put in the URL
      const trackingId = searchParams.get('OrderTrackingId');

      // Only run if we have a tracking ID and haven't verified it yet
      // Also prevent re-running if we already succeeded
      if (trackingId && paymentStatus !== "success") {
        setPaymentStatus("verifying");

        try {
          console.log("Verifying Tracking ID:", trackingId);
          
          // Call your Netlify Backend
          const res = await fetch(`/.netlify/functions/verify?trackingId=${trackingId}`);
          const data = await res.json();

          console.log("Pesapal Verification Response:", data);

          // FIX: Check for "Completed" or "success" (Case Insensitive)
          const status = data.status?.toLowerCase();

          if (status === "completed" || status === "success") {
            // ✅ CRITICAL STEP: Update Firebase to 'paid'
            await updateDoc(doc(db, "orders", orderId), {
              status: 'paid',
              pesapalTrackingId: trackingId,
              paymentMethod: 'Pesapal',
              paidAt: new Date() // Useful for sorting
            });
            
            setPaymentStatus("success");
            
            // Optional: Remove query params to prevent re-verification on refresh
            setSearchParams({});
          } else {
            setPaymentStatus("failed");
            console.error("Payment failed. Status:", data.status);
          }
        } catch (err) {
          console.error("Verification Error:", err);
          setPaymentStatus("failed");
        }
      }
    };

    verifyPayment();
  }, [searchParams, orderId, setSearchParams]); // Removed paymentStatus from dependency to avoid loop issues


  // Helper for time formatting
  const formatTime = (timestamp) => {
    if (!timestamp) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-orange-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        {/* --- Payment Status Banners --- */}
        {paymentStatus === "verifying" && (
          <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            <div>
              <h3 className="font-bold text-blue-800">Verifying Payment...</h3>
              <p className="text-sm text-blue-600">Please wait while we confirm with Pesapal.</p>
            </div>
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-bold text-green-800">Payment Confirmed!</h3>
              <p className="text-sm text-green-600">Your order has been sent to the kitchen.</p>
            </div>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">Payment Issue</h3>
              <p className="text-sm text-red-600">We couldn't verify the payment. Please contact us.</p>
            </div>
          </div>
        )}

        {/* --- Main Header --- */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {order?.status === 'pending' ? 'Order Placed' : 'Order Received!'}
          </h1>
          <p className="mt-2 text-gray-600">
            Current Status: <span className="font-bold uppercase text-orange-600">{order?.status}</span>
          </p>
          <div className="mt-4 inline-block bg-white px-4 py-1 rounded-full border border-orange-100 text-sm font-medium text-orange-700">
            {/* Safe slice */}
            Order ID: #{orderId ? orderId.slice(-6).toUpperCase() : '...'}
          </div>
        </div>

        {/* --- Food Tracker Card --- */}
        <div className="bg-white shadow-xl rounded-3xl overflow-hidden border border-orange-100">
          <div className="p-6 border-b border-gray-50 bg-orange-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <Utensils className="h-5 w-5 text-orange-500" />
              Order Progress
            </h2>
            <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
              <Clock className="h-4 w-4" />
              Ordered at {formatTime(order?.createdAt)}
            </div>
          </div>
          
          <div className="p-8">
            {/* Pass the REAL status to the tracker */}
            <OrderTracker status={order?.status} />
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



















/*import React from 'react';
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
        
        {/* Success Header *//*
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

        {/* Food Tracker Card *//*
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
            {/* The specialized Food Tracker *//*
            <OrderTracker orderId={orderId} />
          </div>
          
          <div className="p-6 bg-gray-50 text-center">
            <p className="text-sm text-gray-500">
              Need to change something? <span className="text-orange-600 font-semibold cursor-pointer">Call Restaurant</span>
            </p>
          </div>
        </div>

        {/* Actions *//*
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

export default OrderStatusPage;*/






















/*import React from 'react';
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
        
        {/* Success Header *//*
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

        {/* Food Tracker Card *//*
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
            {/* The specialized Food Tracker *//*
            <OrderTracker orderId={orderId} />
          </div>
          
          <div className="p-6 bg-gray-50 text-center">
            <p className="text-sm text-gray-500">
              Need to change something? <span className="text-orange-600 font-semibold cursor-pointer">Call Restaurant</span>
            </p>
          </div>
        </div>

        {/* Actions *//*
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

export default OrderStatusPage; */