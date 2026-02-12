import { useEffect, useState, useRef, useMemo } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../components/firebase";
import LogoLoader from "../common/LogoLoader";
import ItemModal from "./ItemModal";
import gsap from "gsap";

const MenuList = ({ onLoaded, setActiveCategory }) => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  
  const menuRef = useRef(null);
  const hasLoaded = useRef(false);

  // 1. FETCH DATA
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const fetchMenuData = async () => {
      const catSnap = await getDocs(query(collection(db, "categories"), where("active", "==", true), orderBy("order", "asc")));
      //const cats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const cats = catSnap.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

      const itemSnap = await getDocs(query(collection(db, "menuItems"), where("available", "==", true)));
      const items = itemSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setCategories(cats);
      setMenuItems(items);
      setLoading(false);
      if (onLoaded) onLoaded();
    };
    fetchMenuData();
  }, [onLoaded]);

  // 2. SEARCH FILTER LOGIC
  const filteredMenuItems = useMemo(() => {
    if (!searchTerm.trim()) return menuItems;
    
    const term = searchTerm.toLowerCase();
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(term) || 
      (item.description && item.description.toLowerCase().includes(term))
    );
  }, [searchTerm, menuItems]);

  // 3. SCROLL SPY LOGIC
  useEffect(() => {
    if (loading || categories.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && setActiveCategory) {
          setActiveCategory(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = document.querySelectorAll(".category-section");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [loading, categories, setActiveCategory]);

  // 4. GSAP ANIMATIONS
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
    <div ref={menuRef} className="pb-32 max-w-[1600px] mx-auto lg:px-12 overflow-x-hidden bg-white">
      
      {/* SEARCH BAR SECTION */}
      <div className="relative bg-white py-2 mb-6 border-b border-gray-100 px-4 md:px-8">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search for dishes, drinks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-sm md:text-base font-medium"
          />
          <svg 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-yellow-500 transition-colors"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-lg"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {categories.map((cat) => {
        // Use filtered items instead of raw menuItems
        const itemsInSection = filteredMenuItems.filter(item => item.categoryId === cat.id);
        if (itemsInSection.length === 0) return null;

        return (
          <section key={cat.id} id={cat.id} className="category-section mt-10 scroll-mt-32 px-4 md:px-8 lg:px-12">
            <h2 className="text-xl font-black mb-4 text-gray-900 uppercase tracking-tight border-l-4 border-yellow-500 pl-4">
              {cat.name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:gap-x-12">
              {itemsInSection.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)}
                  className="menu-item relative cursor-pointer flex items-start gap-4 py-4 border-b border-gray-200 group bg-white hover:bg-gray-50/50 transition-colors"
                >
                  <div className="shimmer-sweep absolute top-0 -left-[100%] w-[50%] h-full z-0 pointer-events-none skew-x-[-25deg] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                  
                  <div className="relative z-10 flex-shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 md:w-24 md:h-24 rounded-lg object-cover shadow-sm" />
                  </div>
                  
                  <div className="flex-1 min-w-0 z-10 flex flex-col justify-between self-stretch">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-[13px] md:text-[15px] font-bold text-gray-800 uppercase leading-tight pt-0.5 break-words">{item.name}</h3>
                        <span className="text-[13px] md:text-[15px] font-black text-gray-900 whitespace-nowrap pt-0.5">KSh {item.price}</span>
                      </div>
                      <p className="text-[11px] md:text-[12px] text-gray-500 line-clamp-2 mt-2 font-medium pr-4 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button 
                        onClick={(e) => {
                           e.stopPropagation();
                           setSelectedItem(item);
                        }} 
                        className="px-5 py-1 text-[13px] rounded-md bg-yellow-500 text-white font-black shadow-md active:scale-75 transition-transform uppercase"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* NO RESULTS STATE */}
      {filteredMenuItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800">No matches found</h3>
          <p className="text-gray-500 text-sm mt-1">Try searching for something else or browse categories.</p>
          <button 
            onClick={() => setSearchTerm("")}
            className="mt-4 text-yellow-600 font-bold uppercase text-xs tracking-widest border-b-2 border-yellow-500"
          >
            Clear Search
          </button>
        </div>
      )}

      <ItemModal item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
};

export default MenuList;
