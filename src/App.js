import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import MenuPage from "./pages/MenuPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderStatusPage from "./pages/OrderStatusPage";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import MenuManager from "./pages/admin/MenuManager";
import OrdersManager from "./pages/admin/OrdersManager";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/admin/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import TableManager from "./pages/admin/TableManager";
import WaiterLogin from "./pages/waiters/WaiterLogin";
import FloorPlan from "./pages/waiters/FloorPlan";
import POS from "./pages/waiters/POS";
import StaffManager from "./pages/admin/StaffManager";
import ReceiptsManager from "./pages/admin/ReceiptsManager";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<MenuPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order/:orderId" element={<OrderStatusPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFound />} />

            {/* --- WAITER ROUTES (Add these lines) --- */}
            <Route path="/waiter/login" element={<WaiterLogin />} />
            <Route path="/waiter/tables" element={<FloorPlan />} />
            <Route path="/waiter/pos/:tableId/:tableName" element={<POS />} />


            {/* PROTECTED Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="menu" element={<MenuManager />} />
              <Route path="orders" element={<OrdersManager />} />
              <Route path="tables" element={<TableManager />} />
              <Route path="staff" element={<StaffManager />} />
              <Route path="receipts" element={<ReceiptsManager />} /> 
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
