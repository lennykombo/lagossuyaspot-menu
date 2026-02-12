/*import { useEffect, useState } from "react";
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
*/





import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase"; // Check your path

export default function CategoryTabs({ activeId, onChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      // Assuming you want "All" + active categories
      const snap = await getDocs(query(collection(db, "categories"), where("active", "==", true), orderBy("order", "asc")));
      //const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const cats = snap.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

      setCategories([{ id: "all", name: "All" }, ...cats]);
    };
    fetchCategories();
  }, []);

  // --- THE FIX: Auto-scroll to active tab ---
  useEffect(() => {
    if (activeId) {
      const activeTab = document.getElementById(`tab-${activeId}`);
      if (activeTab) {
        activeTab.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center" // This centers the button horizontally
        });
      }
    }
  }, [activeId]);
  // ------------------------------------------

  return (
    // Added z-40 to ensure it sits above menu items
    <div className="sticky top-0 z-40 bg-yellow-50/95 backdrop-blur-md border-b border-yellow-100">
      <div className="flex gap-2 overflow-x-auto py-3 px-4 no-scrollbar scroll-smooth">
        {categories.map((cat) => (
          <button
            key={cat.id}
            id={`tab-${cat.id}`} // WE NEED THIS ID FOR THE SCROLL LOGIC
            onClick={() => onChange(cat)}
            className={`
              px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-sm
              ${activeId === cat.id 
                ? "bg-yellow-500 text-white scale-105 shadow-md" 
                : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"}
            `}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}