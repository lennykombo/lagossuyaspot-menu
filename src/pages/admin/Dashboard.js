import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../components/firebase';
import { Link } from 'react-router-dom';
import { Calendar, ArrowUpRight, ArrowDownRight, Smartphone, Utensils } from 'lucide-react';

const Dashboard = () => {
  // --- STATE ---
  const [onlineOrders, setOnlineOrders] = useState([]);
  const [dineInOrders, setDineInOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date Filters (Default to Today)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setHours(0, 0, 0, 0)).toISOString().slice(0, 16),
    end: new Date(new Date().setHours(23, 59, 59, 999)).toISOString().slice(0, 16)
  });

  // --- 1. FETCH DATA (BOTH COLLECTIONS) ---
  useEffect(() => {
    // A. Fetch Online Orders
    const q1 = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub1 = onSnapshot(q1, (snap) => {
      const data = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        source: 'Online',
        createdAtDate: d.data().createdAt?.toDate() || new Date()
      }));
      setOnlineOrders(data);
    });

    // B. Fetch Dine-In (POS) Orders
    const q2 = query(collection(db, "inhouseorders"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(q2, (snap) => {
      const data = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        source: 'Dine-in',
        createdAtDate: d.data().createdAt?.toDate() || new Date()
      }));
      setDineInOrders(data);
    });

    setLoading(false);

    return () => { unsub1(); unsub2(); };
  }, []);

  // --- 2. CALCULATIONS (MERGED DATA) ---
  const metrics = useMemo(() => {
    // 1. Merge Both Lists
    const allOrders = [...onlineOrders, ...dineInOrders].sort((a, b) => b.createdAtDate - a.createdAtDate);

    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    // 2. Filter by Date
    const filtered = allOrders.filter(o => 
      o.createdAtDate >= start && o.createdAtDate <= end
    );

    // 3. Financials (Exclude cancelled)
    const validOrders = filtered.filter(o => o.status !== 'cancelled');
    
    const totalSales = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalTax = 0; 
    const totalDiscount = 0;
    const netSales = totalSales - totalTax;
    const avgOrderValue = validOrders.length > 0 ? totalSales / validOrders.length : 0;

    // 4. Advanced Analytics
    const dayCounts = {};
    const hourCounts = {};

    validOrders.forEach(o => {
      // Day Logic
      const dayName = o.createdAtDate.toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayCounts[dayName]) dayCounts[dayName] = { count: 0, sales: 0 };
      dayCounts[dayName].count += 1;
      dayCounts[dayName].sales += Number(o.totalAmount) || 0;

      // Time Logic
      const hour = o.createdAtDate.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Best Day
    let topDay = "N/A";
    let topDaySales = 0;
    Object.entries(dayCounts).forEach(([day, data]) => {
      if (data.sales > topDaySales) {
        topDaySales = data.sales;
        topDay = day;
      }
    });

    // Best Hour
    let topHour = "N/A";
    let topHourCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > topHourCount) {
        topHourCount = count;
        topHour = parseInt(hour);
      }
    });
    
    const formatTime = (h) => {
      if (h === "N/A") return "N/A";
      const ampm = h >= 12 ? 'pm' : 'am';
      const fHour = h % 12 || 12;
      return `${fHour}${ampm}`;
    };

    // 5. Order Status Percentages
    const totalCount = filtered.length;
    const getPercent = (statusList) => {
      if (totalCount === 0) return 0;
      // Check multiple statuses (e.g., 'completed' OR 'served' for dine-in)
      const count = filtered.filter(o => statusList.includes(o.status)).length;
      return Math.round((count / totalCount) * 100);
    };

    return {
      totalSales,
      netSales,
      totalTax,
      totalDiscount,
      avgOrderValue,
      topDay,
      topDaySales,
      topHour: formatTime(topHour),
      totalOrders: totalCount,
      // Status Mapping: Online uses 'pending', Dine-in uses 'pending'/'ready'/'served'
      statusNew: getPercent(['pending']),
      statusProcessing: getPercent(['processing', 'ready', 'served']), 
      statusCompleted: getPercent(['completed', 'delivered']),
      recentOrders: filtered.slice(0, 5)
    };

  }, [onlineOrders, dineInOrders, dateRange]);


  return (
    <div className="space-y-8 pb-10">
      
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">Combined report (Online + Dine-in)</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Start Date</label>
            <div className="relative">
              <input 
                type="datetime-local" 
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block w-full p-2.5 pl-10 font-bold"
              />
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16}/>
            </div>
          </div>
          <div className="flex flex-col gap-1">
             <label className="text-xs font-bold text-gray-400 uppercase">End Date</label>
             <div className="relative">
              <input 
                type="datetime-local" 
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block w-full p-2.5 pl-10 font-bold"
              />
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16}/>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard 
          label="Total Sales" 
          value={`Ksh ${metrics.totalSales.toLocaleString()}`} 
          sub="Gross Revenue (All Sources)"
          textColor="text-green-600"
        />
        <ReportCard 
          label="Total Net Sales" 
          value={`Ksh ${metrics.netSales.toLocaleString()}`} 
          sub="Revenue after Tax"
          textColor="text-green-600"
        />
        <ReportCard 
          label="Total Discount" 
          value={`Ksh ${metrics.totalDiscount.toFixed(2)}`} 
          sub="Total discount"
          textColor="text-green-600"
        />
        <ReportCard 
          label="Total Tax" 
          value={`Ksh ${metrics.totalTax.toFixed(2)}`} 
          sub="Total Tax Collected"
          textColor="text-green-600"
        />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard 
          label="Avg Order Value" 
          value={`Ksh ${Math.round(metrics.avgOrderValue).toLocaleString()}`} 
          sub="Average per transaction"
          textColor="text-emerald-500"
        />
        <ReportCard 
          label="Ideal Food Cost" 
          value="Ksh 0.00" 
          sub="Target vs Actual"
          textColor="text-emerald-500"
        />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-gray-600 uppercase mb-2">Top Business Day</span>
            <span className="text-3xl font-black text-gray-800">{metrics.topDay}</span>
            <span className="text-xs text-gray-500 mt-1 font-medium">Vol: Ksh {metrics.topDaySales.toLocaleString()}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-gray-600 uppercase mb-2">Top Meal Time</span>
            <span className="text-3xl font-black text-gray-800">{metrics.topHour}</span>
            <span className="text-xs text-gray-500 mt-1">Peak Hour</span>
        </div>
      </div>

      {/* Order Status Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard label="Total Orders" value={metrics.totalOrders} textColor="text-green-600" center />
        <ReportCard label="New" value={`${metrics.statusNew}%`} textColor="text-green-500" center />
        <ReportCard label="Processing" value={`${metrics.statusProcessing}%`} textColor="text-green-500" center />
        <ReportCard label="Completed" value={`${metrics.statusCompleted}%`} textColor="text-green-500" center />
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="font-bold text-gray-800 text-lg">Recent Transactions</h2>
            <Link to="/admin/orders" className="text-yellow-600 text-sm font-bold hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Customer/Table</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metrics.recentOrders.length > 0 ? (
                  metrics.recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    {/* Source Column */}
                    <td className="px-6 py-4">
                      {order.source === 'Online' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">
                          <Smartphone size={12} /> Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-bold border border-orange-100">
                          <Utensils size={12} /> Dine-in
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      {order.createdAtDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>

                    <td className="px-6 py-4">
                      {order.source === 'Online' ? (
                         <div>
                           <p className="font-bold text-gray-800 text-sm">{order.customerName}</p>
                           <p className="text-xs text-gray-400">{order.phone}</p>
                         </div>
                      ) : (
                         <div>
                           <p className="font-bold text-gray-800 text-sm">Table {order.tableName}</p>
                           <p className="text-xs text-gray-400">Waiter: {order.waiterName || 'N/A'}</p>
                         </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wide ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                        (order.status === 'completed' || order.status === 'delivered') ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-gray-700 text-right">
                      Ksh {Number(order.totalAmount).toLocaleString()}
                    </td>
                  </tr>
                ))
                ) : (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400 italic">No orders found in this date range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
};

const ReportCard = ({ label, value, sub, textColor = "text-gray-800", center = false }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center h-full ${center ? 'items-center text-center' : 'items-start text-left'}`}>
    <p className="text-gray-900 text-xs font-bold uppercase mb-2 tracking-wide">{label}</p>
    <p className={`text-3xl font-normal ${textColor} mb-1 truncate w-full`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 font-medium">{sub}</p>}
  </div>
);

export default Dashboard;










/*import React, { useEffect, useState } from 'react';
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
      {/* Header *//*
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Business Overview</h1>
        <p className="text-gray-500">Welcome back to LagosSuya Admin</p>
      </div>

      {/* Stats Grid *//*
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Today's Revenue" value={`Ksh ${stats.todayRevenue}`} color="bg-green-500" icon="💰" />
        <StatCard title="Pending Orders" value={stats.pendingOrders} color="bg-yellow-500" icon="⏳" />
        <StatCard title="Orders Today" value={stats.totalOrdersToday} color="bg-blue-500" icon="📦" />
        <StatCard title="Menu Items" value={stats.activeMenu} color="bg-purple-500" icon="🍔" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table *//*
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

        {/* Quick Actions *//*
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

export default Dashboard;*/