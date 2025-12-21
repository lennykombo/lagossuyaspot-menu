import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../components/firebase";
import LogoLoader from "../common/LogoLoader";
import ItemModal from "./ItemModal";
import gsap from "gsap";

const MenuList = ({ onLoaded }) => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const menuRef = useRef(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const fetchMenuData = async () => {
      const catSnap = await getDocs(query(collection(db, "categories"), where("active", "==", true)));
      const cats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const itemSnap = await getDocs(query(collection(db, "menuItems"), where("available", "==", true)));
      const items = itemSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setCategories(cats);
      setMenuItems(items);
      setLoading(false);
      if (onLoaded) onLoaded();
    };
    fetchMenuData();
  }, [onLoaded]); 

  useEffect(() => {
    if (!loading && menuItems.length > 0) {
      let ctx = gsap.context(() => {
        
        // 1. THE BOUNCY SLIDE IN
        // Use back.out(1.7) for that "overshoot and snap" effect
        gsap.from(".menu-item", {
          x: 120,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(2)", // High bounce value
        });

        // 2. THE BOUNCY PULSE
        // Makes the shimmer feel like a spring
        gsap.fromTo(
          ".menu-item",
          { scale: 0.96, opacity: 0.9 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.9,
            repeat: -1,
            yoyo: true,
            ease: "back.inOut(1)", // Bouncy pulse
            stagger: {
                each: 0.1,
                from: "start"
            }
          }
        );

        // 3. THE SHIMMER BEAM (Yellow light passing through)
        gsap.to(".shimmer-sweep", {
          xPercent: 500,
          duration: 2.2,
          repeat: -1,
          ease: "none",
          stagger: 0.3, 
          delay: 0.5
        });

      }, menuRef);

      return () => ctx.revert();
    }
  }, [loading, menuItems]);

  if (loading) return <LogoLoader />;

  return (
     <div ref={menuRef} className="space-y-6 pt-2 pb-32 overflow-x-hidden">
      {categories.map((cat) => {
        const itemsInSection = menuItems.filter(item => item.categoryId === cat.id);
        if (itemsInSection.length === 0) return null;

        return (
          <section key={cat.id} id={cat.id} className="category-section scroll-mt-24">
             <h2 className="text-sm font-black mb-2 text-gray-700 tracking-widest px-1 uppercase">{cat.name}</h2>
            <div className="space-y-3">
              {itemsInSection.map(item => (
                <div 
                  key={item.id} 
                  className="menu-item relative overflow-hidden flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-50"
                >
                  {/* YELLOW SHIMMER BEAM */}
                  <div className="shimmer-sweep absolute top-0 -left-[100%] w-[70%] h-full z-0 pointer-events-none skew-x-[-25deg] bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />

                  <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-lg object-cover z-10 relative" />
                  
                  <div className="flex-1 z-10 relative">
                    <h3 className="text-sm font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-xs text-gray-400 line-clamp-1">{item.description}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 z-10 relative">
                    <span className="text-sm font-bold text-gray-900">Ksh {item.price}</span>
                    <button 
                      onClick={() => setSelectedItem(item)} 
                      className="px-4 py-1.5 text-xs rounded-full bg-yellow-500 font-bold shadow-sm active:scale-75 transition-transform"
                    >
                      ADD
                    </button>
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













/*import { useEffect, useState } from "react";
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
             <h2 className="text-sm font-black mb-2 text-gray-700 tracking-widest px-1">{cat.name}</h2>
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

export default MenuList;*/