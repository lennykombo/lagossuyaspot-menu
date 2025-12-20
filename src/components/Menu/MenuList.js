import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../components/firebase";
import LogoLoader from "../common/LogoLoader";
import ItemModal from "./ItemModal";

const MenuList = ({ onLoaded }) => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchMenuData = async () => {
      // 1. Get Categories
      const catSnap = await getDocs(query(collection(db, "categories"), where("active", "==", true)));
      const cats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Get All Items
      const itemSnap = await getDocs(query(collection(db, "menuItems"), where("available", "==", true)));
      const items = itemSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setCategories(cats);
      setMenuItems(items);
      setLoading(false);
      if (onLoaded) onLoaded(); // Tells Page we are ready
    };
    fetchMenuData();
  }, [onLoaded]);

  if (loading) return <LogoLoader />;

  return (
     <div className="space-y-6 pt-2 pb-32">
      {categories.map((cat) => {
        const itemsInSection = menuItems.filter(item => item.categoryId === cat.id);
        if (itemsInSection.length === 0) return null;

        return (
          <section key={cat.id} id={cat.id} className="category-section scroll-mt-24">
             <h2 className="text-sm font-black mb-2 text-gray-400 tracking-widest px-1">{cat.name}</h2>
            <div className="space-y-3">
              {itemsInSection.map(item => (
                <div key={item.id} className="menu-item flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-50">
                  <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">{item.name}</h3>
                    <p className="text-xs text-gray-400 line-clamp-1">{item.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-bold">Ksh {item.price}</span>
                    <button onClick={() => setSelectedItem(item)} className="px-4 py-1.5 text-xs rounded-full bg-yellow-500 font-bold">ADD</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      <ItemModal item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
};

export default MenuList;