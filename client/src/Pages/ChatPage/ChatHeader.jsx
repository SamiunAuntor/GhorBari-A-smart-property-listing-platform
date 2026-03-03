import { useState } from 'react';
import { getInitials } from '../../Utilities/ChatHelpers';

export default function ChatHeader({ 
    conversation, 
    onlineUsers,
    onDeleteConversation,
    onBack 
}) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isOnline = onlineUsers?.includes(conversation?.otherUserEmail);

    const handleDelete = async () => {
        if (await onDeleteConversation()) {
            setShowDeleteConfirm(false);
        }
    };

    if (!conversation) {
        return (
            <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4">
                <p className="text-gray-500 text-sm">Select a conversation</p>
            </div>
        );
    }

    return (
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4">
            {/* Left side - User info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Mobile back button */}
                <button
                    onClick={onBack}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center text-white font-semibold text-sm">
                        {getInitials(conversation.otherUserName)}
                    </div>
                    {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                </div>

                {/* Name and status */}
                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 truncate">
                        {conversation.otherUserName}
                        {conversation.otherUserVerified && (
                            <span className="ml-1 text-blue-500 text-sm" title="Verified">✓</span>
                        )}
                    </h2>
                    <p className="text-xs text-gray-500">
                        {isOnline ? (
                            <span className="text-green-600 font-medium">Online</span>
                        ) : (
                            <span>Offline</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
                {/* More options button */}
                <div className="relative group">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.5 1.5H9.5V3.5H10.5V1.5zM10.5 8.5H9.5V10.5H10.5V8.5zM10.5 15.5H9.5V17.5H10.5V15.5z" />
                        </svg>
                    </button>

                    {/* Dropdown menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-t-lg transition-colors"
                        >
                            Delete Conversation
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Conversation</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this conversation with {conversation.otherUserName}? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
