import { useEffect, useState, useRef } from "react";
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

export default MenuPage;