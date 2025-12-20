import { useState, useEffect } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../components/firebase";
import BaseModal from "./BaseModal";

export default function ExtraModal({ open, onClose }) {
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

useEffect(() => {
    if (!open) {
      setLabel("");
      setPrice("");
      setSaving(false);
    }
  }, [open]);
  
  useEffect(() => {
  if (!open) setSaving(false);
}, [open]);

const save = async () => {
  if (saving) return;

  try {
    setSaving(true);

    await addDoc(collection(db, "extras"), {
      label,
      price: Number(price),
      active: true,
      createdAt: new Date(),
    });

    onClose();
  } catch (err) {
    console.error(err);
  } finally {
    setSaving(false);
  }
};


  return (
    <BaseModal open={open} onClose={onClose} title="Add Extra">
      <input
        className="w-full border p-2 rounded mb-2"
        placeholder="Extra name"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />

      <input
        className="w-full border p-2 rounded mb-4"
        placeholder="Price"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <button
  onClick={save}
  disabled={saving}
  className={`w-full py-2 rounded font-semibold ${
    saving
      ? "bg-gray-300 cursor-not-allowed"
      : "bg-yellow-500 hover:bg-yellow-600"
  }`}
>
  {saving ? "Saving..." : "Save"}
</button>


    </BaseModal>
  );
}
