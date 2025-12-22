import { useEffect, useState } from "react";
import { addDoc, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../components/firebase";
import BaseModal from "./BaseModal";

export default function MenuItemModal({ open, onClose, item }) {
  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState(""); 
  const [hasSpiceLevels, setHasSpiceLevels] = useState(false);
  const [extras, setExtras] = useState([]);
  const [selectedExtras, setSelectedExtras] = useState([]);
const [imageFile, setImageFile] = useState(null);
const [imagePreview, setImagePreview] = useState(null);
const [uploading, setUploading] = useState(false);
//const [saving, setSaving] = useState(false);



  useEffect(() => {
  getDocs(collection(db, "categories")).then(snap =>
    //setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setCategories(
  snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(c => c.active !== false)
   )
  );

  getDocs(collection(db, "extras")).then(snap =>
    setExtras(
      snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.active === true)
    )
  );
}, []);


const toggleExtra = (id) => {
  setSelectedExtras(prev =>
    prev.includes(id)
      ? prev.filter(e => e !== id)
      : [...prev, id]
  );
};

const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setImageFile(file);
  setImagePreview(URL.createObjectURL(file));
};

console.log(
  "Cloudinary env:",
  process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
  process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
);

const uploadToCloudinary = async () => {
  if (!imageFile) return null;

  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append(
    "upload_preset",
    process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
  );

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();
  return data.secure_url;
};

const removeImage = () => {
  setImageFile(null);
  setImagePreview(null);
};

const resetForm = () => {
  setName("");
  setPrice("");
  setCategoryId("");
  setDescription("");
  setHasSpiceLevels(false);
  setSelectedExtras([]);
  setImageFile(null);
  setImagePreview(null);
};

useEffect(() => {
  if (item) {
    // ✏️ EDIT MODE
    setName(item.name || "");
    setPrice(item.price || "");
    setCategoryId(item.categoryId || "");
    setDescription(item.description || "");
    setHasSpiceLevels(!!item.hasSpiceLevels);
    setSelectedExtras(item.extras || []);
    setImagePreview(item.imageUrl || null);
    setImageFile(null); // only upload new image if changed
  } else {
    // ➕ ADD MODE
    resetForm();
  }
}, [item, open]);


const save = async () => {
  if (uploading) return;

  try {
    setUploading(true);

    let imageUrl = item?.imageUrl || null;

    // Upload ONLY if user selected a new image
    if (imageFile) {
      imageUrl = await uploadToCloudinary();
    }

    if (item) {
      // ✏️ EDIT
      await updateDoc(doc(db, "menuItems", item.id), {
        name,
        price: Number(price),
        categoryId,
        description,
        hasSpiceLevels,
        extras: selectedExtras,
        imageUrl,
      });
    } else {
      // ➕ ADD
      await addDoc(collection(db, "menuItems"), {
        name,
        price: Number(price),
        categoryId,
        description,
        hasSpiceLevels,
        extras: selectedExtras,
        imageUrl,
        available: true,
        createdAt: new Date(),
      });
    }

    resetForm();
    onClose();
  } catch (err) {
    console.error(err);
  } finally {
    setUploading(false);
    
  }
};


  return (
    <BaseModal open={open} onClose={onClose} title={item ? "Edit Menu Item" : "Add Menu Item"}>
      <div className="mb-4">
  <p className="font-semibold mb-2">Item Image</p>

  {imagePreview && (
  <div className="relative mb-2">
    <img
      src={imagePreview}
      alt="Preview"
      className="w-full h-40 object-cover rounded border"
    />

    <button
      type="button"
      onClick={removeImage}
      className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black"
      title="Remove image"
    >
      ✕
    </button>
  </div>
)}


  <input
  type="file"
  accept="image/*"
  onChange={handleImageChange}
  className="w-full"
  disabled={!!imagePreview}
 />

</div>

      <input
        className="w-full border p-2 rounded mb-2"
        placeholder="Item name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="w-full border p-2 rounded mb-2"
        placeholder="Price"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <select
        className="w-full border p-2 rounded mb-2"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        <option value="">Select category</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <textarea
        className="w-full border p-2 rounded mb-2 min-h-[80px]"
        placeholder="Item description (ingredients, size, etc.)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={hasSpiceLevels}
          onChange={(e) => setHasSpiceLevels(e.target.checked)}
        />
        Has spice levels
      </label>

      {/*<label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={allowExtras}
          onChange={(e) => setAllowExtras(e.target.checked)}
        />
        Allow extras
      </label>*/}
     
      {extras.length > 0 && (
  <div className="mb-4">
    <p className="font-semibold mb-2">Extras</p>

    <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
      {extras.map(extra => (
        <label
          key={extra.id}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedExtras.includes(extra.id)}
              onChange={() => toggleExtra(extra.id)}
            />
            <span>{extra.label}</span>
          </div>

          <span className="text-sm text-gray-500">
            +{extra.price}
          </span>
        </label>
      ))}
    </div>
  </div>
)}

      <button
  onClick={save}
  disabled={uploading || (!imageFile && !item)}
  className={`w-full py-2 rounded font-semibold ${
    uploading || !imageFile
      ? "bg-gray-300 cursor-not-allowed"
      : "bg-yellow-500 hover:bg-yellow-600"
  }`}
>
  {uploading ? "Saving..." : "Save"}
</button>

    </BaseModal>
  );
}
