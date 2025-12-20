import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function CartDrawer({ open, onClose }) {
  const { items, total, updateItem, removeItem } = useCart();
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="
          fixed z-50 bg-white
          bottom-0 left-0 right-0
          md:top-0 md:right-0 md:left-auto md:w-[400px]
          h-[75%] md:h-full
          rounded-t-2xl md:rounded-none
          flex flex-col
          animate-slideUp md:animate-slideIn
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Your Cart</h2>
          <button
            onClick={onClose}
            className="text-xl font-bold text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 && (
            <p className="text-sm text-gray-500 text-center">
              Your cart is empty
            </p>
          )}

          {items.map((item) => (
  <div key={item.id} className="flex justify-between gap-3">
    <div className="flex-1">
      {/* Item name */}
      <p className="text-sm font-medium">{item.name}</p>

      {/* Spice level */}
      {item.spiceLevel && (
      <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
        {item.spiceLevel.replace("-", " ")}
      </span>
    )}

      {/* Extras */}
      {item.extras && item.extras.length > 0 && (
        <ul className="text-xs text-gray-700 list-disc ml-4 mt-1">
          {item.extras.map((extra) => (
            <li key={extra.id}>
              {extra.label} (+Ksh {extra.price})
            </li>
          ))}
        </ul>
      )}
{/* note */}
      {item.note && (
  <p className="text-xs text-gray-500 mt-1 italic">
    “{item.note}”
  </p>
)}


      {/* Quantity controls */}
      <div className="flex items-center gap-2 mt-2">
        <button
          className="w-7 h-7 rounded-full border"
          onClick={() =>
            updateItem(item.id, {
              qty: Math.max(1, (item.qty || 1) - 1),
            })
          }
        >
          −
        </button>

        <span className="text-sm">{item.qty}</span>

        <button
          className="w-7 h-7 rounded-full border"
          onClick={() =>
            updateItem(item.id, {
              qty: (item.qty || 1) + 1,
            })
          }
        >
          +
        </button>
      </div>
    </div>

    {/* Price & remove */}
    <div className="flex flex-col items-end gap-1">
      <span className="text-sm font-semibold">
        Ksh {(item.finalPrice * item.qty).toFixed(0)}
      </span>

      <button
        onClick={() => removeItem(item.id)}
        className="text-xs text-red-500"
      >
        Remove
      </button>
    </div>
  </div>
))}

        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex justify-between mb-4">
            <span className="text-sm font-medium">Subtotal</span>
            <span className="text-sm font-bold">
              Ksh{total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => {
              onClose();
              navigate("/checkout");
            }}
            className="w-full bg-yellow-500 text-black py-3 rounded-full font-semibold"
          >
            Go to Checkout
          </button>
        </div>
      </div>
    </>
  );
}
