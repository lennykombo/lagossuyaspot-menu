import React from 'react';
import { useCart } from '../../context/CartContext';

const CartSummary = () => {
  const { items, total } = useCart();

  return (
    <div className="space-y-4">
      <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-start text-sm">
            <div className="flex-1">
              <p className="font-medium">
                <span className="text-yellow-600 font-bold">{item.qty}x</span> {item.name}
              </p>
              {item.spiceLevel && (
                <p className="text-xs text-gray-400">Spice: {item.spiceLevel}</p>
              )}
              {item.extras?.length > 0 && (
                <p className="text-xs text-gray-400">
                  +{item.extras.map(e => e.label).join(', ')}
                </p>
              )}
            </div>
            <p className="font-semibold">Ksh {item.finalPrice * item.qty}</p>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>Ksh {total}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Delivery</span>
          <span className="text-green-600 uppercase text-xs font-bold">We will call</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
          <span>Total</span>
          <span>Ksh {total}</span>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;









/*import React from 'react'

const CartSummary = () => {
  return (
    <div>CartSummary</div>
  )
}

export default CartSummary*/