import React, { useState } from 'react';
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

  const handleSubmit = async (e) => {
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

export default CheckoutForm;









/*import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function CheckoutForm() {
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔥 Simulate successful checkout
    const fakeOrderId = Date.now().toString();

    // ✅ Clear cart AFTER success
    clearCart();

    // ✅ Redirect to order status
    navigate(`/order/${fakeOrderId}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Checkout</h2>

      <input
        className="w-full border rounded-lg p-3"
        placeholder="Full name"
        required
      />

      <input
        className="w-full border rounded-lg p-3"
        placeholder="Phone number"
        required
      />

      <button
        type="submit"
        className="w-full bg-yellow-500 text-black py-3 rounded-full font-semibold"
      >
        Place Order
      </button>
    </form>
  );
}*/
