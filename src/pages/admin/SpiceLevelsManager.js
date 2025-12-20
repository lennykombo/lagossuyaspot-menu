import { useEffect, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function SpiceLevelsManager() {
  const [levels, setLevels] = useState([]);
  const [label, setLabel] = useState("");

  const load = async () => {
    const snap = await getDocs(collection(db, "spiceLevels"));
    setLevels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!label) return;
    await addDoc(collection(db, "spiceLevels"), {
      label,
      value: label.toLowerCase().replace(" ", "-"),
      active: true,
      order: levels.length + 1,
    });
    setLabel("");
    load();
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Spice Levels</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="border p-2 rounded"
          placeholder="Spice label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button onClick={add} className="bg-yellow-500 px-4 rounded">
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {levels.map(l => (
          <li key={l.id} className="bg-white p-3 rounded shadow">
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
