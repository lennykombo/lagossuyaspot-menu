/*import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
        <h2 className="text-2xl font-black mb-6 text-center uppercase tracking-tight">Admin Login</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center font-bold">{error}</p>}
        
        <div className="space-y-4">
          <input 
            type="email" placeholder="Email" required
            className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition">
            Sign In
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;*/



import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// 1. Import Firestore functions and your db config
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../components/firebase'; 

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    
    try {
      // 2. Login the user
      const userCredential = await login(email, password);
      const user = userCredential.user;

      // 3. Fetch the role from your Firestore 'users' collection
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role;

        // 4. Redirect based on the role
        if (role === "admin") {
          navigate('/admin');
        } else if (role === "kitchen") {
          navigate('/orders-display');
        } else {
          // Fallback if role is not defined correctly
          navigate('/');
        }
      } else {
        setError("User profile not found in database.");
      }
      
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
        <h2 className="text-2xl font-black mb-6 text-center uppercase tracking-tight">Staff Login</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center font-bold">{error}</p>}
        
        <div className="space-y-4">
          <input 
            type="email" placeholder="Email" required
            className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition">
            Sign In
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400 font-medium">
          Admin or Kitchen credentials required.
        </p>
      </form>
    </div>
  );
};

export default LoginPage;