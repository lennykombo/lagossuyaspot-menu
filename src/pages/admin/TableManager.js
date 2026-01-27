import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, // Added updateDoc
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../components/firebase'; 
import { Trash2, Plus, Layout, Square, Edit2, Check, X, Move } from 'lucide-react';

const TableManager = () => {
  const [sections, setSections] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  
  // Create Form States
  const [newSectionName, setNewSectionName] = useState("");
  const [newTableName, setNewTableName] = useState("");
  const [loading, setLoading] = useState(true);

  // --- EDITING STATES ---
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editSectionName, setEditSectionName] = useState("");

  const [editingTableId, setEditingTableId] = useState(null);
  const [editTableName, setEditTableName] = useState("");

  // 1. Fetch Sections
  useEffect(() => {
    const q = query(collection(db, "sections"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sectionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSections(sectionsData);
      
      if (!activeSectionId && sectionsData.length > 0) {
        setActiveSectionId(sectionsData[0].id);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeSectionId]);

  // 2. Fetch Tables for Active Section
  useEffect(() => {
    if (!activeSectionId) {
      setTables([]);
      return;
    }

    const q = query(
      collection(db, "tables"), 
      where("sectionId", "==", activeSectionId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tablesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort: Try to sort numerically if names are like "1", "2", otherwise alphabetical
      tablesData.sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
      setTables(tablesData);
    });
    return () => unsubscribe();
  }, [activeSectionId]);

  // --- CREATE ACTIONS ---
  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    try {
      const docRef = await addDoc(collection(db, "sections"), {
        name: newSectionName.trim()
      });
      setNewSectionName("");
      setActiveSectionId(docRef.id); 
    } catch (error) {
      console.error("Error adding section:", error);
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableName.trim() || !activeSectionId) return;
    try {
      await addDoc(collection(db, "tables"), {
        name: newTableName.trim(),
        sectionId: activeSectionId,
        status: 'available', 
        currentOrderId: null
      });
      setNewTableName("");
    } catch (error) {
      console.error("Error adding table:", error);
    }
  };

  // --- DELETE ACTIONS ---
  const handleDeleteSection = async (id) => {
    if (window.confirm("Delete this section? Tables inside might be lost visually.")) {
      await deleteDoc(doc(db, "sections", id));
      if (activeSectionId === id) setActiveSectionId(null);
    }
  };

  const handleDeleteTable = async (id) => {
    if (window.confirm("Remove this table?")) {
      await deleteDoc(doc(db, "tables", id));
    }
  };

  // --- EDIT ACTIONS (NEW) ---
  
  // 1. Section Editing
  const startEditingSection = (section) => {
    setEditingSectionId(section.id);
    setEditSectionName(section.name);
  };

  const saveSectionUpdate = async (id) => {
    if (!editSectionName.trim()) return;
    try {
      await updateDoc(doc(db, "sections", id), { name: editSectionName.trim() });
      setEditingSectionId(null);
    } catch (error) {
      console.error("Error updating section:", error);
    }
  };

  // 2. Table Editing
  const startEditingTable = (table) => {
    setEditingTableId(table.id);
    setEditTableName(table.name);
  };

  const saveTableUpdate = async (id) => {
    if (!editTableName.trim()) return;
    try {
      await updateDoc(doc(db, "tables", id), { name: editTableName.trim() });
      setEditingTableId(null);
    } catch (error) {
      console.error("Error updating table:", error);
    }
  };


  if (loading) return <div className="p-8">Loading Layout...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Restaurant Layout</h1>
          <p className="text-gray-500">Manage your floor plan and tables</p>
        </div>
      </div>

      {/* --- SECTION MANAGER --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Layout size={18} /> Sections (Floors)
        </h2>
        
        <div className="flex flex-wrap gap-3 items-center">
          {sections.map((section) => {
            const isEditing = editingSectionId === section.id;
            const isActive = activeSectionId === section.id;

            return (
              <div 
                key={section.id}
                onClick={() => !isEditing && setActiveSectionId(section.id)}
                className={`
                  relative px-5 py-3 rounded-xl border-2 font-bold transition-all flex items-center gap-2
                  ${isActive ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}
                  ${isEditing ? "bg-white border-blue-500 ring-2 ring-blue-100" : "cursor-pointer"}
                `}
              >
                {isEditing ? (
                  // EDIT MODE FOR SECTION
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      className="w-24 bg-transparent outline-none border-b border-blue-300 text-gray-800"
                      value={editSectionName}
                      onChange={(e) => setEditSectionName(e.target.value)}
                    />
                    <button onClick={() => saveSectionUpdate(section.id)} className="text-green-600 hover:bg-green-100 rounded p-1"><Check size={14} /></button>
                    <button onClick={() => setEditingSectionId(null)} className="text-red-500 hover:bg-red-100 rounded p-1"><X size={14} /></button>
                  </div>
                ) : (
                  // VIEW MODE FOR SECTION
                  <>
                    {section.name}
                    {isActive && (
                      <div className="flex gap-1 ml-2 pl-2 border-l border-yellow-200">
                        <button 
                          onClick={(e) => { e.stopPropagation(); startEditingSection(section); }}
                          className="p-1 hover:bg-yellow-200 rounded text-yellow-700"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                          className="p-1 hover:bg-red-100 rounded text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Add Section Form */}
          <form onSubmit={handleAddSection} className="flex gap-2">
            <input 
              type="text" 
              placeholder="New Section..." 
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 w-40"
            />
            <button 
              type="submit"
              className="bg-gray-900 text-white p-3 rounded-xl hover:bg-gray-800 transition"
            >
              <Plus size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* --- TABLE MANAGER --- */}
      {activeSectionId ? (
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 border-dashed">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-700 flex items-center gap-2">
              <Square size={18} /> 
              Tables in <span className="text-yellow-600 underline">
                {sections.find(s => s.id === activeSectionId)?.name}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Existing Tables */}
            {tables.map((table) => {
              const isEditing = editingTableId === table.id;

              return (
                <div 
                  key={table.id} 
                  className={`
                    p-6 rounded-xl shadow-sm border flex flex-col items-center justify-center gap-3 relative group transition-all
                    ${isEditing ? 'bg-white border-blue-500 ring-4 ring-blue-50' : 'bg-white border-gray-200 hover:shadow-md'}
                  `}
                >
                  {isEditing ? (
                    // EDIT MODE FOR TABLE
                    <div className="flex flex-col items-center gap-2 w-full">
                      <input 
                        autoFocus
                        value={editTableName}
                        onChange={(e) => setEditTableName(e.target.value)}
                        className="w-full text-center font-bold text-lg bg-gray-50 border-b-2 border-blue-500 focus:outline-none"
                      />
                      <div className="flex gap-2 w-full justify-center mt-2">
                        <button 
                          onClick={() => saveTableUpdate(table.id)}
                          className="flex-1 bg-green-500 text-white py-1 rounded-lg flex justify-center items-center hover:bg-green-600"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => setEditingTableId(null)}
                          className="flex-1 bg-gray-200 text-gray-600 py-1 rounded-lg flex justify-center items-center hover:bg-gray-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // VIEW MODE FOR TABLE
                    <>
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                         {/* Visual indicator that this is a table */}
                         <span className="font-black text-lg">{table.name}</span>
                      </div>
                      
                      {/* Hover Actions Overlay */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg shadow-sm">
                        <button 
                          onClick={() => startEditingTable(table)}
                          className="text-blue-400 hover:text-blue-600 p-1"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTable(table.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      {/* Name Label (Bottom) */}
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Table
                      </span>
                    </>
                  )}
                </div>
              );
            })}

            {/* Add Table Card */}
            <form 
              onSubmit={handleAddTable} 
              className="bg-white p-4 rounded-xl shadow-sm border-2 border-dashed border-yellow-300 flex flex-col items-center justify-center gap-2 opacity-75 hover:opacity-100 transition-opacity"
            >
              <input 
                type="text" 
                placeholder="New #" 
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="text-center w-full bg-yellow-50 border-none rounded-lg px-2 py-2 text-sm font-bold focus:ring-0 placeholder-yellow-600/50"
              />
              <button 
                type="submit" 
                className="text-xs font-bold text-yellow-600 uppercase hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed">
          Please create or select a section to manage tables.
        </div>
      )}
    </div>
  );
};

export default TableManager;