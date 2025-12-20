import { useCart } from "../../context/CartContext";
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
}
