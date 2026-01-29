import React, { useState, useEffect } from 'react';
import { X, Receipt, CheckCircle, CreditCard, Loader2, Printer } from 'lucide-react';

// --- PRINTER CONFIGURATION (Standard UUIDs for Generic Thermal Printers) ---
const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
const PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

const TableBillModal = ({ orders = [], tableId, tableName, currentCart = [], onClose, onPay }) => {
  const [processing, setProcessing] = useState(false);
  const [printing, setPrinting] = useState(false);

  // --- SAFE CALCULATIONS ---
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  const previousTotal = safeOrders.reduce((sum, order) => {
    const docTotal = Number(order.totalAmount) || 0;
    const calculatedTotal = order.items 
      ? order.items.reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0) 
      : 0;
    return sum + (docTotal > 0 ? docTotal : calculatedTotal);
  }, 0);

  const currentCartTotal = currentCart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
  const grandTotal = previousTotal + currentCartTotal;

  // Flatten items for display AND printing
  const allPreviousItems = safeOrders.flatMap(o => o.items || []);
  const allItemsToPrint = [...allPreviousItems, ...currentCart];

  // --- PRINTER HELPER: Format text to fit 32 columns (Standard 58mm paper) ---
  const formatLine = (label, price) => {
    const width = 32;
    const priceStr = price.toLocaleString();
    const labelLen = width - priceStr.length - 1;
    let cleanLabel = label.substring(0, labelLen); 
    const spaces = width - cleanLabel.length - priceStr.length;
    return cleanLabel + ' '.repeat(spaces > 0 ? spaces : 1) + priceStr;
  };

  // --- PRINT FUNCTION ---
  const handlePrint = async () => {
    setPrinting(true);
    try {
      // 1. Connect to Printer
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [PRINTER_SERVICE_UUID] }],
        optionalServices: [PRINTER_SERVICE_UUID]
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(PRINTER_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(PRINTER_CHARACTERISTIC_UUID);

      // 2. Build Receipt Data (ESC/POS)
      const encoder = new TextEncoder();
      const ESC = '\x1B';
      const INIT = ESC + '@';
      const CENTER = ESC + 'a' + '\x01';
      const LEFT = ESC + 'a' + '\x00';
      const BOLD_ON = ESC + 'E' + '\x01';
      const BOLD_OFF = ESC + 'E' + '\x00';
      const FEED = '\x0A';

      let data = INIT;
      
      // Header
      data += CENTER + BOLD_ON + "MY RESTAURANT\n" + BOLD_OFF;
      data += `Table: ${tableName}\n`;
      data += new Date().toLocaleTimeString() + "\n";
      data += "--------------------------------\n";
      data += LEFT;

      // Items
      allItemsToPrint.forEach(item => {
        const total = item.price * item.qty;
        const line = `${item.qty}x ${item.name}`;
        data += formatLine(line, total) + "\n";
        
        // Print extras underneath
        if (item.selectedExtras?.length > 0) {
           item.selectedExtras.forEach(ex => {
             data += `   + ${ex.label || ex.name}\n`;
           });
        }
      });

      // Total
      data += "--------------------------------\n";
      data += CENTER + BOLD_ON + `TOTAL: Ksh ${grandTotal.toLocaleString()}\n` + BOLD_OFF;
      data += "\nThank you for dining with us!\n";
      data += FEED + FEED + FEED; // Feed paper at end

      // 3. Send to Printer (in chunks to prevent overflow)
      const buffer = encoder.encode(data);
      const chunkSize = 512;
      for (let i = 0; i < buffer.byteLength; i += chunkSize) {
        const chunk = buffer.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
      }

      if (device.gatt.connected) device.gatt.disconnect();

    } catch (error) {
      console.error("Print Error:", error);
      alert("Could not print. Ensure Bluetooth is ON and you are using Chrome on Android/Desktop.");
    }
    setPrinting(false);
  };

  const handlePaymentClick = async () => {
    if (window.confirm(`Confirm payment of Ksh ${grandTotal.toLocaleString()} and free this table?`)) {
      setProcessing(true);
      await onPay();
    }
  };

  const renderItemDetails = (item) => (
    <div className="text-[11px] text-gray-500 leading-tight ml-4 mt-1 space-y-0.5">
      {item.selectedSpice && (
        <div className="text-orange-600 font-semibold">
          🔥 {item.selectedSpice}
        </div>
      )}
      {item.selectedExtras?.map((extra, i) => (
        <div key={i}>
          + {extra.label || extra.name} <span className="text-gray-400">({extra.price})</span>
        </div>
      ))}
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
          
          {/* NEW: Print Button */}
          <button 
            onClick={handlePrint}
            disabled={printing}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold uppercase hover:bg-blue-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {printing ? <Loader2 className="animate-spin" /> : <Printer />}
            {printing ? "Printing..." : "Print Bill"}
          </button>

          {/* Existing Pay Button */}
          <button 
            onClick={handlePaymentClick}
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












/*import React, { useState, useEffect } from 'react';
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
      {/* Spice *//*
      {item.selectedSpice && (
        <div className="text-orange-600 font-semibold">
          🔥 {item.selectedSpice}
        </div>
      )}
      
      {/* Extras *//*
      {item.selectedExtras?.map((extra, i) => (
        <div key={i}>
          + {extra.label || extra.name} <span className="text-gray-400">({extra.price})</span>
        </div>
      ))}

      {/* Note *//*
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
          
          {currentCart.length > 0 && (
            <div className="mb-4 p-4 bg-red-100 border border-red-200 rounded-xl text-red-700 text-sm font-bold text-center">
              ⚠️ You have unsent items.<br/>Send to kitchen or remove before paying.
            </div>
          )}

          {/* Section 1: Previous Orders (Sent) *//*
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

          {/* Section 2: Current Cart (Unsent) *//*
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

        {/* Footer Actions *//*
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
*/























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