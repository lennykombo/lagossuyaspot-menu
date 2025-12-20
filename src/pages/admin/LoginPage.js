import React, { useState } from 'react';
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

export default LoginPage;