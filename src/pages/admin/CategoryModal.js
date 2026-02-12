import { useState, useEffect } from "react";
//import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import {
  addDoc,
  collection,
  updateDoc,
  doc,
  getDocs,
  query,
  orderBy,
  limit
} from "firebase/firestore";

import { db } from "../../components/firebase";
import BaseModal from "./BaseModal";

export default function CategoryModal({ open, onClose, category }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
  if (category) {
    setName(category.name); // edit mode
  } else {
    setName(""); // add mode
  }
}, [category, open]);


  /*const save = async () => {
    if (!name) return;

    await addDoc(collection(db, "categories"), {
      name,
      active: true,
      createdAt: new Date(),
    });

    setName("");
    onClose();
  };*/

  /*const save = async () => {
  if (!name) return;

  if (category) {
    // ✏️ EDIT EXISTING
    await updateDoc(doc(db, "categories", category.id), {
      name,
    });
  } else {
    // ➕ ADD NEW
    await addDoc(collection(db, "categories"), {
      name,
      active: true,
      createdAt: new Date(),
    });
  }

  setName("");
  onClose();
};

const remove = async () => {
  if (!category) return;

  if (!window.confirm("Delete this category?")) return;

  await updateDoc(doc(db, "categories", category.id), {
    active: false,
  });

  onClose();
};*/

const save = async () => {
    if (!name || saving) return;

    try {
      setSaving(true);

      if (category) {
        // ✏️ Edit
        await updateDoc(doc(db, "categories", category.id), {
          name,
        });
      } else {
        /* ➕ Add
        await addDoc(collection(db, "categories"), {
          name,
          active: true,
          createdAt: new Date(),
           order,
        });*/
        // ➕ Add NEW category

      // 1️⃣ Find highest order
      const q = query(
        collection(db, "categories"),
        orderBy("order", "desc"),
        limit(1)
      );

      const snap = await getDocs(q);

      // 2️⃣ Calculate next order safely
      const order = snap.empty ? 0 : snap.docs[0].data().order + 1;

      // 3️⃣ Save category
      await addDoc(collection(db, "categories"), {
        name,
        active: true,
        createdAt: new Date(),
        order,
      });
      }

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };


  return (
    <BaseModal open={open} onClose={onClose} title="Add Category">
      <input
        className="w-full border p-2 rounded mb-4"
        placeholder="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button
        onClick={save}
        disabled={saving}
        className={`w-full py-2 rounded font-semibold mb-2 ${
          saving
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-yellow-500 hover:bg-yellow-600"
        }`}
      >
        {saving ? "Saving..." : "Save"}
      </button>

      {/*category && (
        <button
          onClick={remove}
          disabled={saving}
          className="w-full py-2 rounded font-semibold bg-red-100 text-red-600 hover:bg-red-200"
        >
          Delete Category
        </button>
      )*/}

    </BaseModal>
  );
}
