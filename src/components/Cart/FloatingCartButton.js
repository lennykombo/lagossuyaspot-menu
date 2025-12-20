import { useCart } from "../../context/CartContext";

export default function FloatingCartButton({ onClick }) {
  const { itemCount, total } = useCart();

  // Hide button if cart is empty
  if (itemCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-4 left-4 right-4 z-50
        flex items-center justify-between
        bg-yellow-500 text-black
        px-5 py-3 rounded-full
        shadow-lg
        md:left-auto md:right-6 md:bottom-6 md:w-auto
      "
    >
      {/* Left: Cart info */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">
          🛒 {itemCount} item{itemCount > 1 ? "s" : ""}
        </span>
      </div>

      {/* Right: Total */}
      <span className="text-sm font-bold ml-1">
        Ksh{total.toFixed(2)}
      </span>
    </button>
  );
}
