import React, { useState, useEffect } from 'react';
import { X, Receipt, CheckCircle, CreditCard, Loader2 } from 'lucide-react';

const TableBillModal = ({ orders = [], tableId, tableName, currentCart = [], onClose, onPay }) => {
  const [processing, setProcessing] = useState(false);

  // DEBUG: Check what data is actually arriving
  useEffect(() => {
    console.log("Bill Modal Data - Previous Orders:", orders);
    console.log("Bill Modal Data - Current Cart:", currentCart);
  }, [orders, currentCart]);

  // --- SAFE CALCULATIONS ---
  // Ensure we are working with arrays
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  // Calculate Total of previously sent items (Firestore Data)
  const previousTotal = safeOrders.reduce((sum, order) => {
    // Check if totalAmount exists, otherwise calculate from items
    const docTotal = Number(order.totalAmount) || 0;
    // Fallback: if totalAmount is missing, sum the items manually
    const calculatedTotal = order.items 
      ? order.items.reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0) 
      : 0;
      
    return sum + (docTotal > 0 ? docTotal : calculatedTotal);
  }, 0);

  // Calculate Total of unsent items (Local State)
  const currentCartTotal = currentCart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
  
  const grandTotal = previousTotal + currentCartTotal;

  // Flatten all items from previous orders into one list for display
  const allPreviousItems = safeOrders.flatMap(o => o.items || []);

  const handlePaymentClick = async () => {
    if (window.confirm(`Confirm payment of Ksh ${grandTotal.toLocaleString()} and free this table?`)) {
      setProcessing(true);
      await onPay();
    }
  };

  // Helper to render item details
  const renderItemDetails = (item) => (
    <div className="text-[11px] text-gray-500 leading-tight ml-4 mt-1 space-y-0.5">
      {/* Spice */}
      {item.selectedSpice && (
        <div className="text-orange-600 font-semibold">
          🔥 {item.selectedSpice}
        </div>
      )}
      
      {/* Extras */}
      {item.selectedExtras?.map((extra, i) => (
        <div key={i}>
          + {extra.label || extra.name} <span className="text-gray-400">({extra.price})</span>
        </div>
      ))}

      {/* Note */}
      {item.note && (
        <div className="text-blue-500 italic">
          "{item.note}"
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-6 relative">
          <button onClick={onClose} disabled={processing} className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700">
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500 rounded-lg text-black">
              <CreditCard size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide">Checkout Table {tableName}</h2>
              <p className="text-gray-400 text-sm">Finalize Bill</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-end">
            <span className="text-gray-400 font-bold uppercase text-xs">Total Due</span>
            <span className="text-3xl font-black text-green-400">Ksh {grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          
          {currentCart.length > 0 && (
            <div className="mb-4 p-4 bg-red-100 border border-red-200 rounded-xl text-red-700 text-sm font-bold text-center">
              ⚠️ You have unsent items.<br/>Send to kitchen or remove before paying.
            </div>
          )}

          {/* Section 1: Previous Orders (Sent) */}
          {allPreviousItems.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500 uppercase border-b flex items-center gap-2">
                   <CheckCircle size={12} className="text-green-600"/> Sent to Kitchen
                </div>
                {allPreviousItems.map((item, idx) => (
                  <div key={idx} className="p-3 border-b last:border-0 text-sm text-gray-600">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-gray-800">{item.qty}x</span> {item.name}
                      </div>
                      <div className="font-mono font-bold">{(item.price * item.qty).toLocaleString()}</div>
                    </div>
                    {renderItemDetails(item)}
                  </div>
                ))}
            </div>
          ) : (
             <div className="text-center text-gray-400 italic py-4 text-xs border-b mb-4">No previous kitchen orders found for this table.</div>
          )}

          {/* Section 2: Current Cart (Unsent) */}
          {currentCart.length > 0 && (
            <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 overflow-hidden">
                <div className="bg-yellow-100 px-4 py-2 text-xs font-bold text-yellow-700 uppercase border-b">
                   Unsent Items (Current Cart)
                </div>
                {currentCart.map((item, idx) => (
                  <div key={idx} className="p-3 border-b border-yellow-100 last:border-0 text-sm text-yellow-900">
                     <div className="flex justify-between items-start">
                        <div><span className="font-bold">{item.qty}x</span> {item.name}</div>
                        <div className="font-mono font-bold">{(item.price * item.qty).toLocaleString()}</div>
                     </div>
                     {renderItemDetails(item)}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t space-y-3">
          <button 
            onClick={handlePaymentClick}
            // Allow payment if there are previous items OR cart items (though cart items should ideally be sent first)
            disabled={ (allPreviousItems.length === 0 && currentCart.length === 0) || processing }
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold uppercase hover:bg-green-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 className="animate-spin" /> : <CheckCircle />}
            Receive Payment & Free Table
          </button>

          <button onClick={onClose} disabled={processing} className="w-full py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default TableBillModal;
























/*import React, { useState } from 'react';
import { X, Receipt, CheckCircle, CreditCard, Loader2 } from 'lucide-react';

const TableBillModal = ({ orders, tableId, tableName, currentCart, onClose, onPay }) => {
  const [processing, setProcessing] = useState(false);

  // Calculate Totals
  const previousTotal = orders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
  const currentCartTotal = currentCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const grandTotal = previousTotal + currentCartTotal;

  const allPreviousItems = orders.flatMap(o => o.items || []);

  const handlePaymentClick = async () => {
    if (window.confirm(`Confirm payment of Ksh ${grandTotal.toLocaleString()} and free this table?`)) {
      setProcessing(true);
      await onPay();
      // The parent component will handle navigation, so we don't need to setProcessing(false)
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header *//*
        <div className="bg-gray-900 text-white p-6 relative">
          <button onClick={onClose} disabled={processing} className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700">
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500 rounded-lg text-black">
              <CreditCard size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide">Checkout Table {tableName}</h2>
              <p className="text-gray-400 text-sm">Finalize Bill</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-end">
            <span className="text-gray-400 font-bold uppercase text-xs">Total Due</span>
            <span className="text-3xl font-black text-green-400">Ksh {grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* List *//*
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Warning if Cart is not empty *//*
          {currentCart.length > 0 && (
            <div className="mb-4 p-4 bg-red-100 border border-red-200 rounded-xl text-red-700 text-sm font-bold text-center">
              ⚠️ You have unsent items in the cart.<br/>Please send to kitchen or remove them before closing.
            </div>
          )}

          {allPreviousItems.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {allPreviousItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between p-3 border-b last:border-0 text-sm text-gray-600">
                    <div><span className="font-bold text-gray-800">{item.qty}x</span> {item.name}</div>
                    <div className="font-mono">{(item.price * item.qty).toLocaleString()}</div>
                  </div>
                ))}
            </div>
          ) : (
             <div className="text-center text-gray-400 italic py-4">No items ordered.</div>
          )}
        </div>

        {/* Footer Actions *//*
        <div className="p-4 bg-white border-t space-y-3">
          
          <button 
            onClick={handlePaymentClick}
            disabled={currentCart.length > 0 || allPreviousItems.length === 0 || processing}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold uppercase hover:bg-green-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 className="animate-spin" /> : <CheckCircle />}
            Receive Payment & Free Table
          </button>

          <button onClick={onClose} disabled={processing} className="w-full py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">
            Back to Menu
          </button>
        </div>

      </div>
    </div>
  );
};

export default TableBillModal;*/