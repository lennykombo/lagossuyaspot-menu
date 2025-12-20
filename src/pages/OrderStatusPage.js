import React from 'react'
import { useParams } from "react-router-dom";
import OrderTracker from '../components/Order/OrderTracker'

const OrderStatusPage = () => {

     const { orderId } = useParams();
     
  return (
     <div className="order-status-page">
      <OrderTracker orderId={orderId} />
    </div>
  )
}

export default OrderStatusPage