import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../components/firebase";
import LogoLoader from "../common/LogoLoader";
import ItemModal from "./ItemModal";
import gsap from "gsap";

// We pass 'setActiveCategory' so this component can tell the Tab bar which section is visible
const MenuList = ({ onLoaded, setActiveCategory }) => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const menuRef = useRef(null);
  const hasLoaded = useRef(false);

  // 1. FETCH DATA
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

  // 2. SCROLL SPY LOGIC (Intersection Observer)
  useEffect(() => {
    if (loading || categories.length === 0) return;

    const observerOptions = {
      root: null, // use the viewport
      rootMargin: "-20% 0px -70% 0px", // triggers when section is near the top
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Tell the parent component which ID is now active
          if (setActiveCategory) setActiveCategory(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Start watching every category section
    const sections = document.querySelectorAll(".category-section");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [loading, categories, setActiveCategory]);

  // 3. GSAP ANIMATIONS (Restored exactly as requested)
  useEffect(() => {
    if (!loading && menuItems.length > 0) {
      let ctx = gsap.context(() => {
        gsap.from(".menu-item", {
          x: 120, opacity: 0, duration: 0.8, stagger: 0.1, ease: "back.out(2)",
        });

        gsap.fromTo(".menu-item", 
          { scale: 0.98, opacity: 0.9 },
          { scale: 1, opacity: 1, duration: 1.2, repeat: -1, yoyo: true, ease: "back.inOut(1.5)", stagger: 0.2 }
        );

        gsap.to(".shimmer-sweep", {
          xPercent: 1200, duration: 2.5, repeat: -1, ease: "none", stagger: 0.4, delay: 1
        });
      }, menuRef);
      return () => ctx.revert();
    }
  }, [loading, menuItems]);

  if (loading) return <LogoLoader />;

  return (
    <div ref={menuRef} className="pb-32 px-4 md:px-8 max-w-[1600] mx-auto lg:px-12 overflow-x-hidden bg-white">
      {categories.map((cat) => {
        const itemsInSection = menuItems.filter(item => item.categoryId === cat.id);
        if (itemsInSection.length === 0) return null;

        return (
          // Important: 'id' must match the Tab link's href
          // 'category-section' is the class used by the IntersectionObserver
          <section key={cat.id} id={cat.id} className="category-section mt-10 scroll-mt-28">
            <h2 className="text-xl font-black mb-4 text-gray-900 uppercase tracking-tight border-l-4 border-yellow-500 pl-4">
              {cat.name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:gap-x-12">
              {itemsInSection.map(item => (
                <div key={item.id} className="menu-item relative flex items-start gap-4 py-3 border-b border-gray-200 group bg-white">
                  <div className="shimmer-sweep absolute top-0 -left-[100%] w-[50%] h-full z-0 pointer-events-none skew-x-[-25deg] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                  
                  <div className="relative z-10 flex-shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover shadow-sm" />
                  </div>
                  
                  <div className="flex-1 min-w-0 z-10 flex flex-col justify-between self-stretch">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-[13px] md:text-[15px] font-bold text-gray-800 uppercase leading-tight pt-0.5 break-words">{item.name}</h3>
                        <span className="text-[13px] md:text-[15px] font-black text-gray-900 whitespace-nowrap pt-0.5">KSh {item.price}</span>
                      </div>
                      <p className="text-[11px] md:text-[12px] text-gray-500 line-clamp-2 mt-2 font-medium pr-4 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => setSelectedItem(item)} className="px-5 py-1 text-[13px] rounded-md bg-yellow-500 text-white font-black shadow-md active:scale-75 transition-transform uppercase">Add</button>
                    </div>
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