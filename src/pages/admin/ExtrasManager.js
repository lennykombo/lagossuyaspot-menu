import { useEffect, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function ExtrasManager() {
  const [extras, setExtras] = useState([]);
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");

  const load = async () => {
    const snap = await getDocs(collection(db, "extras"));
    setExtras(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!label || !price) return;
    await addDoc(collection(db, "extras"), {
      label,
      price: Number(price),
      active: true,
    });
    setLabel("");
    setPrice("");
    load();
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Extras</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="border p-2 rounded"
          placeholder="Extra name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button onClick={add} className="bg-yellow-500 px-4 rounded">
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {extras.map(e => (
          <li key={e.id} className="bg-white p-3 rounded shadow">
            {e.label} — Ksh {e.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
