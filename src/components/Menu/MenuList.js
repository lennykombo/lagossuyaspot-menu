import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../components/firebase";
import LogoLoader from "../common/LogoLoader";
import ItemModal from "./ItemModal";
import gsap from "gsap";

const MenuList = ({ category }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  /* -------------------------
     Slide-up animation
  --------------------------*/
  useEffect(() => {
    if (!menuItems.length || loading) return;

    gsap.fromTo(
      ".menu-item",
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.95,
        stagger: { each: 0.18 },
        ease: "power4.out",
        clearProps: "opacity",
      }
    );
  }, [menuItems, loading]);

  /* -------------------------
     Shimmer animation
  --------------------------*/
  useEffect(() => {
    if (!menuItems.length || loading) return;

    gsap.to(".menu-item .menu-shimmer", {
      x: "240%",
      duration: 3.5,
      repeat: -1,
      ease: "none",
      delay: 0.6,
      stagger: {
        each: 0.4,
        from: "random",
      },
    });
  }, [menuItems, loading]);

  /* -------------------------
     Fetch menu items
  --------------------------*/
  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);

      let q = query(
        collection(db, "menuItems"),
        where("available", "==", true)
      );

      if (category?.id && category.id !== "all") {
        q = query(
          collection(db, "menuItems"),
          where("available", "==", true),
          where("categoryId", "==", category.id)
        );
      }

      const snap = await getDocs(q);

      setMenuItems(
        snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
      );

      setLoading(false);
    };

    fetchMenuItems();
  }, [category]);

  /* -------------------------
     LOADING STATE (ONE ONLY)
  --------------------------*/
  if (loading) {
    return <LogoLoader />;
  }

  if (!menuItems.length) {
    return (
      <p className="text-center text-sm text-gray-500">
        No items in this category
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {menuItems.map(item => (
          <div
            key={item.id}
            className="menu-item relative overflow-hidden flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm"
          >
            {/* Shimmer */}
            <span className="menu-shimmer absolute inset-0 z-0 pointer-events-none" />

            {/* Content */}
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-20 h-20 rounded-lg object-cover relative z-10"
            />

            <div className="flex-1 relative z-10">
              <h3 className="text-sm font-semibold text-gray-900">
                {item.name}
              </h3>
            </div>

            <div className="flex flex-col items-end gap-2 relative z-10">
              <span className="text-sm font-semibold">
                Ksh {Number(item.price).toFixed(0)}
              </span>
              <button
                onClick={() => setSelectedItem(item)}
                className="px-4 py-1.5 text-xs rounded-full bg-yellow-500 font-semibold"
              >
                ADD
              </button>
            </div>
          </div>
        ))}
      </div>

      <ItemModal
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
};

export default MenuList;
