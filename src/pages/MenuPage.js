import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import MenuList from "../components/Menu/MenuList";
import CartDrawer from "../components/Cart/CartDrawer";
import CategoryTabs from "../components/Menu/CategoryTabs";
import FloatingCartButton from "../components/Cart/FloatingCartButton";

const MenuPage = () => {
  const [category, setCategory] = useState({ id: "all", name: "All" });
  const [cartOpen, setCartOpen] = useState(false);

  const containerRef = useRef(null);
  const menuRef = useRef(null);

  /* Page enter animation */
  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: "power2.out",
      }
    );
  }, []);

  /* Category change animation */
  useEffect(() => {
    if (!menuRef.current) return;

    gsap.fromTo(
      menuRef.current,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.25,
        ease: "power2.out",
      }
    );
  }, [category]);

  return (
    <div className="bg-yellow-50 min-h-screen">
      <div
        ref={containerRef}
        className="max-w-3xl mx-auto px-4 py-4"
      >
        <CategoryTabs onChange={setCategory} />

        <div ref={menuRef}>
          <MenuList category={category} />
        </div>
      </div>

      <FloatingCartButton onClick={() => setCartOpen(true)} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </div>
  );
};

export default MenuPage;
