import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

export default function CategoryTabs({ activeId, onChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(query(collection(db, "categories"), where("active", "==", true)));
      const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories([{ id: "all", name: "All" }, ...cats]);
    };
    fetchCategories();
  }, []);

  return (
     <div className="flex gap-2 overflow-x-auto py-2.5 sticky top-0 bg-yellow-50/95 backdrop-blur-md z-30 scrollbar-hide border-b border-yellow-100">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat)}
          className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap transition duration-200
            ${activeId === cat.id ? "bg-yellow-400 border-yellow-400 text-black font-bold" : "bg-white text-gray-700"}`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}