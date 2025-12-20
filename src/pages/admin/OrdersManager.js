//import { useState } from "react";
//import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
//import { db } from "../../firebase";

const OrdersManager = () => {

    // const [orders, setOrders] = useState([]);

  /*useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, []);*/

  /*const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", id), { status });
  };*/


  return (
     <div>
      <h1 className="text-xl font-semibold mb-4">Orders</h1>

      <div className="space-y-4">
        {/*orders.map(order => (
          <div key={order.id} className="bg-white p-4 rounded shadow">
            <p className="font-medium">Order #{order.id}</p>
            <p>Status: {order.status}</p>
            <p>Total: Ksh {order.total}</p>

            <div className="flex gap-2 mt-2">
              {/*<button onClick={() => updateStatus(order.id, "preparing")}>
                Preparing
              </button>
              <button onClick={() => updateStatus(order.id, "ready")}>
                Ready
              </button>
            </div>
          </div>
        ))*/}
      </div>
    </div>
  )
}

export default OrdersManager