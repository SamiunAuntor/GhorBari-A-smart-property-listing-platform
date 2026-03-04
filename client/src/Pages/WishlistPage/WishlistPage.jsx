import React, { useState } from 'react';
import useWishlist from '../../Hooks/useWishlist';
import useAuth from '../../Hooks/useAuth';
import WishlistPropertyCard from './WishlistPropertyCard';

const WishlistPage = () => {
    const { user } = useAuth();
    const { wishlistItems, loading, remove, updateNote } = useWishlist();
    const [editingId, setEditingId] = useState(null);
    const [tempNote, setTempNote] = useState('');

    if (!user) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500">Please login to view and manage your property wishlist.</p>
                </div>
            </div>
        );
    }

    const handleEdit = (item) => {
        setEditingId(item._id);
        setTempNote(item.wishlistNote || '');
    };

    const saveNote = async (id) => {
        await updateNote(id, tempNote);
        setEditingId(null);
        setTempNote('');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Wishlist</h1>
                        <p className="text-gray-500 mt-1">Manage your favorite properties and personal reminders.</p>
                    </div>
                    {!loading && wishlistItems.length > 0 && (
                        <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-600">
                            {wishlistItems.length} Saved Properties
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : wishlistItems.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 text-lg">Your wishlist is currently empty.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {wishlistItems.map((item) => (
                            <div key={item._id} className="group flex flex-col">
                                <WishlistPropertyCard
                                    property={item}
                                    isEditing={editingId === item._id}
                                    tempNote={tempNote}
                                    onTempNoteChange={setTempNote}
                                    onEditNote={() => handleEdit(item)}
                                    onSaveNote={() => saveNote(item._id)}
                                    onCancelEdit={() => {
                                        setEditingId(null);
                                        setTempNote('');
                                    }}
                                    onRemove={() => remove(item._id)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;
