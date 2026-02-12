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






import { useState, useRef, useEffect } from "react";
import MenuList from "../components/Menu/MenuList";
import CategoryTabs from "../components/Menu/CategoryTabs";
import CartDrawer from "../components/Cart/CartDrawer";
import FloatingCartButton from "../components/Cart/FloatingCartButton";

const MenuPage = () => {
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [scrollToCategoryId, setScrollToCategoryId] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [anyModalOpen, setAnyModalOpen] = useState(false);

  // We use this ref to prevent the scroll-spy from overriding the user's click
  // while the page is still scrolling to the target.

  const containerRef = useRef(null);
  const isManualScroll = useRef(false);

  // 1. Handle Click on Tab
 /* const handleTabChange = (category) => {
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
  };*/

   // Scroll listener for Scroll-to-Top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowScrollTop(true);
      else setShowScrollTop(false);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

   const handleTabChange = (category) => {
    setActiveCategoryId(category.id);
    isManualScroll.current = true;
    setScrollToCategoryId(category.id); // trigger useEffect scroll
  };

   useEffect(() => {
    if (!scrollToCategoryId || !containerRef.current) return;

    const container = containerRef.current;
    //const element = container.querySelector(`#${scrollToCategoryId}`);
    const element = document.getElementById(scrollToCategoryId);
    if (!element) return;

    // Detect sticky WordPress header dynamically
    const stickyHeader = document.querySelector(".sticky"); // change if your WP header uses another class
    const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 0;

    const containerTop = container.getBoundingClientRect().top;
    const elementTop = element.getBoundingClientRect().top;

    const scrollPosition = container.scrollTop + (elementTop - containerTop - headerHeight);

    container.scrollTo({
      top: scrollPosition,
      behavior: "smooth",
    });

    // Re-enable scroll spy after animation
    setTimeout(() => {
      isManualScroll.current = false;
    }, 800);

    setScrollToCategoryId(null);
  }, [scrollToCategoryId]);


  // 2. Handle Scroll Spy (Called from MenuList)
  /*const handleScrollSpy = (id) => {
    if (!isManualScroll.current) {
      setActiveCategoryId(id);
    }
  };*/

   // 3️⃣ Handle Scroll Spy
  const handleScrollSpy = (id) => {
    if (!isManualScroll.current) setActiveCategoryId(id);
  };


  const scrollToTop = () => {
  if (containerRef.current) {
    containerRef.current.scrollTo({
      top: 0,         // scroll container to top
      behavior: "smooth"
    });
  }
};


  return (
     <div 
      ref={containerRef} 
      className="bg-white min-h-screen overflow-y-auto relative"
      style={{ scrollBehavior: "smooth", maxHeight: "100vh" }}
    >
      
      <div className="w-full">
        <CategoryTabs 
          activeId={activeCategoryId} 
          onChange={handleTabChange}  
        />
        
        {/* Pass the setter down to MenuList */}
        <MenuList 
          setActiveCategory={handleScrollSpy}
          onLoaded={() => console.log("Menu Loaded")}
          onModalOpenChange={(isOpen) => setShowScrollTop(!isOpen)}
        />
      </div>

      <FloatingCartButton onClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

{showScrollTop && !anyModalOpen && (
       <button
  onClick={scrollToTop}
  className="fixed flex-col bottom-6 left-6 z-50 bg-yellow-500 text-white font-mono p-3 rounded-md shadow-lg hover:bg-yellow-600 transition"
>
  <div>↑ </div><div>up</div>
</button>
)}


    </div>
  );
};

export default MenuPage;