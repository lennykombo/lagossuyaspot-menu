import { useState, useEffect } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../components/firebase";
import BaseModal from "./BaseModal";

export default function SpiceLevelModal({ open, onClose }) {
  const [label, setLabel] = useState("");
    const [saving, setSaving] = useState(false);


    useEffect(() => {
        if (!open) {
          setLabel("");
          setSaving(false);
        }
      }, [open]);

   const save = async () => {
    if (!label && saving) return;

    try {
      setSaving(true);

      await addDoc(collection(db, "spiceLevels"), {
        label,
        value: label.toLowerCase().replace(/\s+/g, "-"),
        active: true,
        createdAt: new Date(),
      });

      setLabel("");
      onClose();
    } catch (err) {
      console.error("Failed to save spice level:", err);
      setSaving(false);
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} title="Add Spice Level">
      <input
        className="w-full border p-2 rounded mb-4"
        placeholder="Spice label (e.g Extra Spicy)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
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
