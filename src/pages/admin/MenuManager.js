import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../components/firebase";

import CategoryModal from "../admin/CategoryModal";
import SpiceLevelModal from "../admin/SpiceLevelModal";
import ExtraModal from "../admin/ExtraModal";
import MenuItemModal from "../admin/MenuItemModal";

export default function MenuManager() {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [spiceOpen, setSpiceOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [spiceLevels, setSpiceLevels] = useState([]);
  const [extras, setExtras] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);


useEffect(() => {
  const fetchData = async () => {
    const catsSnap = await getDocs(collection(db, "categories"));
    //setCategories(catsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setCategories( catsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(c => c.active !== false)
);


    const itemsSnap = await getDocs(collection(db, "menuItems"));
    setMenuItems(itemsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  fetchData();
}, [categoryOpen, itemOpen]);


  useEffect(() => {
    const fetchData = async () => {
      const cats = await getDocs(collection(db, "categories"));
      setCategories(cats.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(c => c.active !== false)
);


      const spices = await getDocs(collection(db, "spiceLevels"));
      setSpiceLevels(
        spices.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(s => s.active)
      );

      const exts = await getDocs(collection(db, "extras"));
      setExtras(
        exts.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(e => e.active)
      );
    };

    fetchData();
  }, [categoryOpen, spiceOpen, extraOpen, itemOpen]);

  const deleteCategory = async (category) => {
  if (!window.confirm("Delete this category?")) return;

  await updateDoc(doc(db, "categories", category.id), {
    active: false,
  });

  // ✅ REMOVE FROM UI IMMEDIATELY
  setCategories(prev =>
    prev.filter(c => c.id !== category.id)
  );
};
  
const deleteMenuItem = async (item) => {
  if (!window.confirm("Delete this menu item?")) return;

  await updateDoc(doc(db, "menuItems", item.id), {
    available: false,
  });

  // 🔥 UPDATE UI IMMEDIATELY
  setMenuItems(prev =>
    prev.filter(i => i.id !== item.id)
  );
};

const activeCategories = categories.filter(
  c => c.active !== false
);

const activeMenuItems = menuItems.filter(
  i => i.available !== false
);


  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Menu Manager</h1>
        <p className="text-gray-500">Manage categories, extras and menu items</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <ActionButton onClick={() => {
                 setEditingCategory(null);
                 setCategoryOpen(true);
           }}>
          + Category
        </ActionButton>

        <ActionButton onClick={() => setSpiceOpen(true)}>
          + Spice Level
        </ActionButton>

        <ActionButton onClick={() => setExtraOpen(true)}>
          + Extra
        </ActionButton>

        <ActionButton primary onClick={() => setItemOpen(true)}>
          + Menu Item
        </ActionButton>
      </div>

      {/* Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/*<DataCard
          title="Categories"
          items={categories}
          render={(c) => c.name}
        />*/}
        <DataCard
  title="Categories"
  //items={categories.filter(c => c.active !== false)}
  items={activeCategories}
  render={(c) => (
    <div className="flex justify-between items-center">
      <span>{c.name}</span>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setEditingCategory(c);
            setCategoryOpen(true);
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          Edit
        </button>

        <button
           onClick={() => deleteCategory(c)}
          className="text-sm text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  )}
/>


        <DataCard
          title="Spice Levels"
          items={spiceLevels}
          render={(s) => s.label}
        />

        <DataCard
          title="Extras"
          items={extras}
          render={(e) => `${e.label} (+${e.price})`}
        />
      </div>

      {/* Modals */}
      <CategoryDrawer
  categories={activeCategories}
  menuItems={activeMenuItems}
  onEdit={(item) => {
    setEditingItem(item);
    setItemOpen(true);
  }}
  onDelete={deleteMenuItem}
/>

      <SpiceLevelModal
        open={spiceOpen}
        onClose={() => setSpiceOpen(false)}
      />

      <ExtraModal
        open={extraOpen}
        onClose={() => setExtraOpen(false)}
      />

      {/*<MenuItemModal
        open={itemOpen}
        onClose={() => setItemOpen(false)}
      />*/}
      <MenuItemModal
  open={itemOpen}
  item={editingItem} 
  onClose={() => {
    setItemOpen(false);
    setEditingItem(null);
  }}
/>


      <CategoryModal
  open={categoryOpen}
  category={editingCategory}
  onClose={() => {
    setCategoryOpen(false);
    setEditingCategory(null);
  }}
/>

    </div>
  );
}

/* ---------------- Reusable Components ---------------- */

function ActionButton({ children, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded font-medium transition ${
        primary
          ? "bg-yellow-500 text-black hover:bg-yellow-600"
          : "bg-gray-100 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function DataCard({ title, items, render }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h3 className="font-semibold mb-3">{title}</h3>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No items yet</p>
      ) : (
        <ul className="space-y-2">
          {items.map(item => (
            <li
              key={item.id}
              className="text-sm border-b pb-1 last:border-none"
            >
              {render(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryDrawer({ categories, menuItems, onEdit, onDelete }) {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="border rounded-lg bg-white shadow-sm mt-6">
      <h3 className="font-semibold p-4 border-b">Menu Items</h3>

      {categories.map(cat => {
        const items = menuItems.filter(
          item => item.categoryId === cat.id
        );

        const isOpen = openId === cat.id;

        return (
          <div key={cat.id} className="border-b last:border-none">
            <button
              onClick={() => setOpenId(isOpen ? null : cat.id)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
            >
              <span className="font-medium">{cat.name}</span>
              <span className="text-sm text-gray-500">
                {items.length} items
              </span>
            </button>

            {isOpen && (
              <div className="bg-gray-50 px-4 pb-3 space-y-2">
                {items.length === 0 && (
                  <p className="text-sm text-gray-400">
                    No menu items
                  </p>
                )}

                {items.map(item => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-white p-2 rounded border text-sm"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-gray-500">{item.price}</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onDelete(item)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}








/*import { useState } from "react";
import CategoryModal from "../admin/CategoryModal";
import SpiceLevelModal from "../admin/SpiceLevelModal";
import ExtraModal from "../admin/ExtraModal";
import MenuItemModal from "../admin/MenuItemModal";

export default function MenuManager() {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [spiceOpen, setSpiceOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Menu Manager</h1>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setCategoryOpen(true)}>Add Category</button>
        <button onClick={() => setSpiceOpen(true)}>Add Spice</button>
        <button onClick={() => setExtraOpen(true)}>Add Extra</button>
        <button onClick={() => setItemOpen(true)}>Add Item</button>
      </div>

      <CategoryModal open={categoryOpen} onClose={() => setCategoryOpen(false)} />
      <SpiceLevelModal open={spiceOpen} onClose={() => setSpiceOpen(false)} />
      <ExtraModal open={extraOpen} onClose={() => setExtraOpen(false)} />
      <MenuItemModal open={itemOpen} onClose={() => setItemOpen(false)} />
    </div>
  );
}*/
