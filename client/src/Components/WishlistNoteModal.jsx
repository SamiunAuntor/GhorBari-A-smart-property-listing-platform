import React, { useEffect, useState } from "react";

const WishlistNoteModal = ({ isOpen, title, onClose, onSave }) => {
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setNote("");
            setSaving(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(note);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
            <button
                className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                aria-label="Close modal"
            />
            <div className="relative w-full max-w-sm rounded-xl border border-gray-100 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-sm font-bold text-gray-900">Add Note to Wishlist</h3>
                <p className="mt-1 text-xs text-gray-500 line-clamp-1">{title || "Property"}</p>

                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note..."
                    className="mt-4 w-full rounded-lg border border-gray-200 p-3 text-sm outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none"
                    rows={3}
                    autoFocus
                />

                <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WishlistNoteModal;
