import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../components/firebase";
import { useCart } from "../../context/CartContext";

export default function ItemModal({ item, open, onClose }) {
  const { addItem, items, updateItem } = useCart();

  const [qty, setQty] = useState(1);
  const [spice, setSpice] = useState(null);
  const [extras, setExtras] = useState([]);
  const [note, setNote] = useState("");

  const [spiceLevels, setSpiceLevels] = useState([]);
  const [extrasList, setExtrasList] = useState([]);

  const hasSpice = item?.hasSpiceLevels === true;
  const hasExtras =
    Array.isArray(item?.extras) && item.extras.length > 0;

  /* ----------------------------------
     Fetch spice levels & extras
  -----------------------------------*/
  useEffect(() => {
    if (!open || !item) return;

    const fetchOptions = async () => {
      // 🔥 Spice levels
      if (hasSpice) {
        const spiceSnap = await getDocs(
          query(
            collection(db, "spiceLevels"),
            where("active", "==", true)
          )
        );

        setSpiceLevels(
          spiceSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }

      // 🧀 Extras (only those linked to item)
      if (hasExtras) {
        const extrasSnap = await getDocs(
          query(
            collection(db, "extras"),
            where("active", "==", true)
          )
        );

        const allExtras = extrasSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));

        setExtrasList(
          allExtras.filter(e => item.extras.includes(e.id))
        );
      }
    };

    fetchOptions();
  }, [open, item, hasSpice, hasExtras]);

  if (!open || !item) return null;

  /* ----------------------------------
     Helpers
  -----------------------------------*/
  const toggleExtra = (extra) => {
    setExtras(prev =>
      prev.find(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
  const itemTotal = (item.price + extrasTotal) * qty;

  const handleAdd = () => {
    const cartItem = {
      ...item,
      qty,
      extras,
      spiceLevel: hasSpice ? spice : null,
      note,
      finalPrice: item.price + extrasTotal,
    };

    const existing = items.find(
      i =>
        i.id.startsWith(item.id) &&
        JSON.stringify(i.extras) === JSON.stringify(extras) &&
        i.spiceLevel === cartItem.spiceLevel
    );

    if (existing) {
      updateItem(existing.id, { qty: existing.qty + qty });
    } else {
      addItem({ ...cartItem, id: `${item.id}-${Date.now()}` });
    }

    // reset
    setQty(1);
    setExtras([]);
    setSpice(null);
    setNote("");
    onClose();
  };

  /* ----------------------------------
     UI
  -----------------------------------*/
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 
                md:inset-0 md:m-auto md:max-w-md md:rounded-xl
                max-h-[90vh] flex flex-col">
      <div className="overflow-y-auto p-4 flex-1">
        <div className="flex justify-end mb-2">
  <button
    onClick={onClose}
    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg"
    aria-label="Close"
  >
    ✕
  </button>
</div>

        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-48 object-cover rounded-xl mb-3"
          />
       )}
        <h2 className="text-lg font-semibold">{item.name}</h2>
        <p className="text-sm text-gray-500 mt-1">{item.description}</p>

        {/* 🔥 Spice Levels */}
        {hasSpice && (
  <div className="mt-4">
    <h3 className="font-medium mb-2">Spice Level</h3>

    <div className="space-y-2">
      {spiceLevels.map((level) => (
        <label
          key={level.id}
          className="flex items-center gap-3 border rounded-lg p-3 text-sm cursor-pointer"
        >
          <input
            type="radio"
            name="spice"
            value={level.value}
            checked={spice === level.value}
            onChange={() => setSpice(level.value)}
          />
          <span>{level.label}</span>
        </label>
      ))}
    </div>
  </div>
)}


        {/* 🧀 Extras */}
        {hasExtras && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Extras</h3>
            <div className="space-y-2">
              {extrasList.map(extra => (
                <label
                  key={extra.id}
                  className="flex items-center justify-between border rounded-lg p-2 text-sm"
                >
                  <span>
                    {extra.label} (+Ksh {extra.price})
                  </span>
                  <input
                    type="checkbox"
                    checked={!!extras.find(e => e.id === extra.id)}
                    onChange={() => toggleExtra(extra)}
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mt-4">
          <h3 className="font-medium mb-1">Special instructions</h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="E.g. no sugar, well done"
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>

        {/* Quantity */}
        <div className="flex justify-between items-center mt-6">
          <span>Quantity</span>
          <div className="flex items-center gap-3">
            <button
              className="w-8 h-8 border rounded-full"
              onClick={() => setQty(Math.max(1, qty - 1))}
            >
              −
            </button>
            <span>{qty}</span>
            <button
              className="w-8 h-8 border rounded-full"
              onClick={() => setQty(qty + 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAdd}
          className="w-full bg-yellow-500 text-black py-3 rounded-full font-semibold mt-6"
        >
          Add • Ksh {itemTotal}
        </button>
        </div>
      </div>
    </>
  );
}
