import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../components/firebase';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    pendingOrders: 0,
    totalOrdersToday: 0,
    activeMenu: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    // 1. Fetch Orders for Today & Stats
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsubOrders = onSnapshot(q, (snap) => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Calculate Stats
      const today = new Date().toDateString();
      const todayOrders = orders.filter(o => 
        o.createdAt?.toDate().toDateString() === today
      );

      const revenue = todayOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

      const pending = orders.filter(o => o.status === 'pending').length;

      setStats(prev => ({
        ...prev,
        todayRevenue: revenue,
        pendingOrders: pending,
        totalOrdersToday: todayOrders.length
      }));

      // Set only the 5 most recent orders for the table
      setRecentOrders(orders.slice(0, 5));
    });

    // 2. Fetch Menu Count
    const unsubMenu = onSnapshot(collection(db, "menuItems"), (snap) => {
      setStats(prev => ({ ...prev, activeMenu: snap.size }));
    });

    return () => {
      unsubOrders();
      unsubMenu();
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Business Overview</h1>
        <p className="text-gray-500">Welcome back to LagosSuya Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Today's Revenue" value={`Ksh ${stats.todayRevenue}`} color="bg-green-500" icon="💰" />
        <StatCard title="Pending Orders" value={stats.pendingOrders} color="bg-yellow-500" icon="⏳" />
        <StatCard title="Orders Today" value={stats.totalOrdersToday} color="bg-blue-500" icon="📦" />
        <StatCard title="Menu Items" value={stats.activeMenu} color="bg-purple-500" icon="🍔" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="font-bold text-gray-800">Recent Orders</h2>
            <Link to="/admin/orders" className="text-yellow-600 text-sm font-bold hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{order.customerName}</p>
                      <p className="text-xs text-gray-400">{order.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className={`px-2 py-1 rounded-full font-bold uppercase ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-gray-700">
                      Ksh {order.totalAmount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/admin/orders" className="block w-full text-center py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-600 transition">
                Open Order Manager
              </Link>
              <Link to="/admin/menu" className="block w-full text-center py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition">
                Update Menu Items
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for Stats
const StatCard = ({ title, value, color, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-gray-200`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
      <p className="text-xl font-black text-gray-800">{value}</p>
    </div>
  </div>
);

export default Dashboard;