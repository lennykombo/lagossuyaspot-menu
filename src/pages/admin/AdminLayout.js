import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from "react-router-dom"; // Added useNavigate
import { useAuth } from "../../context/AuthContext"; // Import your Auth Context
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingBag,
  Map,
  Users,
  Receipt,
  LogOut 
} from 'lucide-react';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useAuth(); // Destructure logout from context
  const navigate = useNavigate();

  const navLinks = [
    { to: "/admin", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { to: "/admin/menu", label: "Menu Items", icon: <UtensilsCrossed size={20} /> },
    { to: "/admin/orders", label: "Orders", icon: <ShoppingBag size={20} /> },
    { to: "/admin/tables", label: "Floor Plan", icon: <Map size={20} /> },
    { to: "/admin/staff", label: "Staff", icon: <Users size={20} /> },
    { to: "/admin/receipts", label: "Sales & Receipts", icon: <Receipt size={20} /> },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login"); // Redirect to login page after logout
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* --- MOBILE OVERLAY (Backdrop) --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo Section */}
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-bold text-yellow-600 uppercase tracking-tight">LagosSuya</h2>
          <button className="md:hidden p-1" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1 flex-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/admin"}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 p-3 rounded-xl transition-all
                ${isActive 
                  ? "bg-yellow-500 text-white shadow-md" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-yellow-600"}
              `}
            >
              {link.icon}
              <span className="font-medium">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Button at Bottom */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="bg-white border-b p-4 flex items-center justify-between md:hidden sticky top-0 z-30">
          <button onClick={toggleSidebar} className="p-2 bg-gray-50 rounded-lg">
            <Menu size={24} />
          </button>
          <h2 className="font-bold text-gray-800 uppercase text-sm tracking-widest">Admin</h2>
          <div className="w-10" /> 
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;