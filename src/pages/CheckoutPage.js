import React from 'react'
import CheckoutForm from '../components/Checkout/CheckoutForm'
import CartSummary from '../components/Cart/CartSummary'

const CheckoutPage = () => {
  return (
    <div className="checkout-page">
      <CheckoutForm />
      <CartSummary />
    </div>
  )
}

export default CheckoutPage