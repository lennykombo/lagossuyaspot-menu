import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function CategoryTabs({ onChange }) {
  const [active, setActive] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, "categories"));

      const cats = snap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(c => c.active !== false);

      setCategories([{ id: "all", name: "All" }, ...cats]);
    };

    fetchCategories();
  }, []);

  const selectCategory = (category) => {
    setActive(category.id);
    onChange?.(category); // ✅ pass full object
  };

  return (
    <div className="flex gap-2 overflow-x-auto py-3 mb-4 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => selectCategory(cat)}
          className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap transition
            ${
              active === cat.id
                ? "bg-yellow-400 border-yellow-400 text-black font-semibold"
                : "bg-white border-gray-300 text-gray-700"
            }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
