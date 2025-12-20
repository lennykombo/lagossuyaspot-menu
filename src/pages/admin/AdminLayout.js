import React from 'react'
import { NavLink, Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
     <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4">
        <h2 className="text-lg font-bold mb-6">Admin</h2>

        <nav className="space-y-2">
          <NavLink to="/admin" className="block p-2 rounded hover:bg-gray-100">
            Dashboard
          </NavLink>
          <NavLink to="/admin/menu" className="block p-2 rounded hover:bg-gray-100">
            Menu Items
          </NavLink>
          <NavLink to="/admin/orders" className="block p-2 rounded hover:bg-gray-100">
            Orders
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout