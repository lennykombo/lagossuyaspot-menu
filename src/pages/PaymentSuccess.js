import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const navigate = useNavigate();

  const trackingId = searchParams.get('OrderTrackingId');
  const merchantRef = searchParams.get('OrderMerchantReference');

  useEffect(() => {
    const verify = async () => {
      try {
        // Call a Netlify function to verify status (similar to pay.js but using GetTransactionStatus)
        const res = await fetch(`/.netlify/functions/verify?trackingId=${trackingId}`);
        const data = await res.json();

        if (data.status === "COMPLETED") {
          await updateDoc(doc(db, "orders", merchantRef), {
            status: 'paid',
            pesapalTrackingId: trackingId
          });
          setStatus("success");
        } else {
          setStatus("failed");
        }
      } catch (err) {
        setStatus("error");
      }
    };
    if (trackingId) verify();
  }, [trackingId, merchantRef]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {status === "verifying" && <h2 className="text-xl font-bold">Verifying your payment...</h2>}
      {status === "success" && (
        <div className="bg-white p-8 rounded-3xl shadow-xl">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-black mb-2 uppercase">Payment Successful!</h2>
          <p className="text-gray-500 mb-6">Your order is being prepared by the kitchen.</p>
          <button onClick={() => navigate('/')} className="w-full bg-yellow-500 py-3 rounded-xl font-bold">Back to Menu</button>
        </div>
      )}
      {status === "failed" && <h2 className="text-red-500 font-bold">Payment was not completed. Please contact support.</h2>}
    </div>
  );
};

export default PaymentSuccess;