export default function BaseModal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-xl">×</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {children}
        </div>

      </div>
    </div>
  );
}
