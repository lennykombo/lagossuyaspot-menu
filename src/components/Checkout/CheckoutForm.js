import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { db } from '../firebase'; // Ensure this path matches your file structure
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CheckoutForm = () => {
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

   // Define Delivery Fee here as well
  const DELIVERY_FEE = 20;
  const grandTotal = total + DELIVERY_FEE;

  // Added 'email' to state because Pesapal requires it
  const [formData, setFormData] = useState({
    customerName: '',
    email: '', 
    phone: '',
    address: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return alert("Your cart is empty");
    
    setLoading(true);

    try {
      // 1. Save to Firebase first (Status: 'pending')
      // We do this so we have an Order ID to give to Pesapal
      const orderData = {
        ...formData,
        items,
         subtotal: total,           // Save subtotal for records
        deliveryFee: DELIVERY_FEE, // Save delivery fee for records
        totalAmount: grandTotal,   // This is the amount the user PAYS
       // totalAmount: total,
        status: 'pending', // Will become 'paid' after successful payment
        createdAt: serverTimestamp(),
        paymentMethod: 'Pesapal'
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      console.log("Order created with ID: ", docRef.id);

      // 2. Call the Netlify Backend Function
      const response = await fetch('/.netlify/functions/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: grandTotal,
          // Map your form data to what pay.js expects:
          name: formData.customerName,
          email: formData.email, 
          phone: formData.phone,
          orderId: docRef.id // Pass the Firebase ID
        })
      });

      const data = await response.json();

      // 3. Handle Redirect
      if (data.redirect_url) {
        // Optional: Clear cart now, or clear it on the success page
        clearCart(); 
        
        // Redirect user to Pesapal
        window.location.href = data.redirect_url;
      } else {
        console.error("Pesapal Error:", data);
        alert("Payment initialization failed. Please try again.");
      }

    } catch (error) {
      console.error("Checkout Error: ", error);
      alert("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            required
            type="text"
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-yellow-500 outline-none"
            placeholder="John Doe"
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
          />
        </div>

        {/* Email (Required for Pesapal) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            required
            type="email"
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-yellow-500 outline-none"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            required
            type="tel"
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-yellow-500 outline-none"
            placeholder="0712 345 678"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
          <textarea
            required
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-yellow-500 outline-none"
            placeholder="Apartment, Street, Area"
            rows="3"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full font-bold py-4 rounded-xl transition-colors disabled:opacity-50 
          ${loading ? 'bg-gray-300 text-gray-600' : 'bg-yellow-500 hover:bg-yellow-600 text-black'}`}
      >
        {loading ? "Processing..." : `Pay Now • Ksh ${grandTotal}`}
      </button>

      <p className="text-center text-xs text-gray-400 mt-2">
        Secure payment via Pesapal
      </p>
    </form>
  );
};

export default CheckoutForm;

















/*import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const CheckoutForm = () => {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    notes: ''
  });

 /* const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return alert("Your cart is empty");
    
    setLoading(true);

    try {
      const orderData = {
        ...formData,
        items,
        totalAmount: total,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      // Save to Firebase
      const docRef = await addDoc(collection(db, "orders"), orderData);
      console.log("Document written with ID: ", docRef.id);

      clearCart();
      alert("Order placed successfully!");
      navigate(`/order/${docRef.orderId}`);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };*/

  /*const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return alert("Your cart is empty");
    
    setLoading(true);

    try {
      const orderData = {
        ...formData,
        items,
        totalAmount: total,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      // 1. Save to Firebase and capture the reference in 'docRef'
      const docRef = await addDoc(collection(db, "orders"), orderData);
      console.log("Document written with ID: ", docRef.id);

      // 2. Clear the cart before navigating
      clearCart();
      
      // 3. Navigate using docRef.id
      navigate(`/order/${docRef.id}`);
      
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // for payment intergration
  /*const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1. Save order as 'awaiting_payment' in Firebase
    const orderData = {
      ...formData,
      items,
      totalAmount: total,
      status: 'awaiting_payment',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "orders"), orderData);

    // 2. Call Netlify Function
    const response = await fetch('/.netlify/functions/pay', {
      method: 'POST',
      body: JSON.stringify({
        orderId: docRef.id,
        amount: total,
        phone: formData.phone,
        name: formData.customerName,
        email: "customer@email.com" // PesaPal V3 usually requires an email
      })
    });

    const data = await response.json();
    if (data.redirect_url) {
      clearCart();
      window.location.href = data.redirect_url; // Redirect to PesaPal
    }
  } catch (error) {
    alert("Payment failed to start. Try again.");
  } finally {
    setLoading(false);
  }
};*//*

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            required
            type="text"
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-yellow-500 outline-none"
            placeholder="John Doe"
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            required
            type="tel"
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-yellow-500 outline-none"
            placeholder="0712 345 678"
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
          <textarea
            required
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-yellow-500 outline-none"
            placeholder="Apartment, Street, Area"
            rows="3"
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? "Processing..." : `Place Order • Ksh ${total}`}
      </button>
    </form>
  );
};

export default CheckoutForm;*/

