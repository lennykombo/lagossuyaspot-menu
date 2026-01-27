import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../components/firebase";
import { X, Minus, Plus, Check, Loader2 } from "lucide-react";

export default function POSItemModal({ item, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [spice, setSpice] = useState(null);
  const [extras, setExtras] = useState([]);
  const [note, setNote] = useState("");

  const [spiceLevels, setSpiceLevels] = useState([]);
  const [extrasList, setExtrasList] = useState([]);
  const [loading, setLoading] = useState(true);

  const hasSpice = item?.hasSpiceLevels === true;
  const hasExtras = Array.isArray(item?.extras) && item.extras.length > 0;

  useEffect(() => {
    if (!item) return;

    const fetchOptions = async () => {
      try {
        // Fetch Spice Levels
        if (hasSpice) {
          const spiceSnap = await getDocs(
            query(collection(db, "spiceLevels"), where("active", "==", true))
          );
          setSpiceLevels(spiceSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }

        // Fetch Extras
        if (hasExtras) {
          const extrasSnap = await getDocs(
            query(collection(db, "extras"), where("active", "==", true))
          );
          const allExtras = extrasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Filter only extras allowed for this item
          setExtrasList(allExtras.filter(e => item.extras.includes(e.id)));
        }
      } catch (err) {
        console.error("Error loading options", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [item, hasSpice, hasExtras]);

  const toggleExtra = (extra) => {
    setExtras(prev =>
      prev.find(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const extrasTotal = extras.reduce((sum, e) => sum + (Number(e.price) || 0), 0);
  const unitPrice = (Number(item.price) || 0) + extrasTotal;
  const totalPrice = unitPrice * qty;

  const handleConfirm = () => {
    if (hasSpice && !spice) {
      alert("Please select a spice level");
      return;
    }

    const finalizedItem = {
      ...item,
      qty,
      selectedExtras: extras, 
      selectedSpice: spice,
      note,
      price: unitPrice, 
      // Unique ID including options
      variantId: `${item.id}-${spice || 'ns'}-${extras.map(e=>e.id).sort().join('')}`
    };

    onConfirm(finalizedItem);
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div>
             <h2 className="text-xl font-black text-gray-800 uppercase leading-none">{item.name}</h2>
             <p className="text-sm text-gray-500 mt-1">Customize Item</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-10 text-gray-400">
               <Loader2 className="animate-spin mb-2" size={32}/>
               <p>Loading Options...</p>
             </div>
          ) : (
            <>
              {/* Spice Levels */}
              {hasSpice && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                    🌶 Spice Level <span className="text-red-500 text-[10px]">*Required</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {spiceLevels.map((level) => (
                      <label 
                        key={level.id}
                        className={`
                          flex items-center gap-3 border-2 rounded-xl p-3 cursor-pointer transition-all
                          ${spice === level.value 
                            ? "border-green-600 bg-green-50 text-green-900 font-bold shadow-md" 
                            : "border-gray-200 text-gray-600 hover:border-gray-300"}
                        `}
                      >
                        <input
                          type="radio"
                          name="spice"
                          value={level.value} // Use 'value' (e.g., 'mild')
                          checked={spice === level.value}
                          onChange={() => setSpice(level.value)}
                          className="w-5 h-5 text-green-600 focus:ring-green-500 accent-green-600"
                        />
                        <span>{level.label}</span> {/* Use 'label' (e.g., 'Mild') */}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Extras */}
              {hasExtras && extrasList.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">🧀 Add Extras</h3>
                  <div className="space-y-3">
                    {extrasList.map(extra => {
                      const isSelected = !!extras.find(e => e.id === extra.id);
                      return (
                        <label
                          key={extra.id}
                          className={`
                            flex items-center justify-between border-2 rounded-xl p-3 cursor-pointer transition-all
                            ${isSelected ? "bg-yellow-50 border-yellow-400 shadow-sm" : "border-gray-100 hover:border-gray-200"}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleExtra(extra)}
                              className="w-5 h-5 rounded text-yellow-600 focus:ring-yellow-500 accent-yellow-600"
                            />
                            <span className={`font-bold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                              {extra.label} {/* Use 'label' (e.g., 'Semolina/Fufu') */}
                            </span>
                          </div>
                          <span className="font-bold text-gray-800">+ {extra.price}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">📝 Kitchen Note</h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. No onions..."
                  className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all"
                  rows={2}
                />
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-700">Quantity</span>
                <div className="flex items-center gap-4 bg-white rounded-lg border shadow-sm px-2 py-1">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600"><Minus size={18}/></button>
                  <span className="text-xl font-black w-8 text-center">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600"><Plus size={18}/></button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white">
          <button
            onClick={handleConfirm}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Add to Order • Ksh {totalPrice.toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}