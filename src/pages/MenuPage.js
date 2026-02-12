/*import { useEffect, useState, useRef } from "react";
import MenuList from "../components/Menu/MenuList";
import CategoryTabs from "../components/Menu/CategoryTabs";
import CartDrawer from "../components/Cart/CartDrawer";
import FloatingCartButton from "../components/Cart/FloatingCartButton";

const MenuPage = () => {
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const isManualScroll = useRef(false);

  // This logic highlights the tab when you scroll
  useEffect(() => {
    if (!menuReady) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualScroll.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategoryId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -70% 0px" }
    );

    document.querySelectorAll(".category-section").forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [menuReady]);

  // This logic scrolls the page when you click a tab
  const handleTabChange = (category) => {
    setActiveCategoryId(category.id);
    const element = document.getElementById(category.id);
    if (element) {
      isManualScroll.current = true;
      window.scrollTo({ top: element.offsetTop - 100, behavior: "smooth" });
      setTimeout(() => { isManualScroll.current = false; }, 800);
    }
  };

  return (
    <div className="bg-yellow-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <CategoryTabs activeId={activeCategoryId} onChange={handleTabChange} />
        <MenuList onLoaded={() => setMenuReady(true)} />
      </div>

      <FloatingCartButton onClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default MenuPage;*/






import { useState, useRef } from "react";
import MenuList from "../components/Menu/MenuList";
import CategoryTabs from "../components/Menu/CategoryTabs";
import CartDrawer from "../components/Cart/CartDrawer";
import FloatingCartButton from "../components/Cart/FloatingCartButton";

const MenuPage = () => {
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  
  // We use this ref to prevent the scroll-spy from overriding the user's click
  // while the page is still scrolling to the target.
  const isManualScroll = useRef(false);

  // 1. Handle Click on Tab
  const handleTabChange = (category) => {
    // Determine target ID
    const targetId = category.id === "all" ? "menu-top" : category.id; // Assuming top of menu has an ID or just handle 'all' logic
    
    // Update state immediately for visual feedback
    setActiveCategoryId(category.id);
    isManualScroll.current = true;

    const element = document.getElementById(category.id);
    if (element) {
      // Offset calculation for the sticky header height
      const headerOffset = 140; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });

      // Re-enable scroll spy after animation finishes
      setTimeout(() => {
        isManualScroll.current = false;
      }, 800);
    }
  };

  // 2. Handle Scroll Spy (Called from MenuList)
  const handleScrollSpy = (id) => {
    if (!isManualScroll.current) {
      setActiveCategoryId(id);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* 
         REMOVED max-w-4xl px-4 py-4 wrapping the whole thing.
         This allows CategoryTabs to be full width (sticky).
         The centering is handled inside MenuList now.
      */}
      
      <div className="w-full">
        <CategoryTabs 
          activeId={activeCategoryId} 
          onChange={handleTabChange} 
        />
        
        {/* Pass the setter down to MenuList */}
        <MenuList 
          setActiveCategory={handleScrollSpy}
          onLoaded={() => console.log("Menu Loaded")}
        />
      </div>

      <FloatingCartButton onClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default MenuPage;