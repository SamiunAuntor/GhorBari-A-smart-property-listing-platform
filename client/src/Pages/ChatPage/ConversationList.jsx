import { useState, useEffect, useContext } from 'react';
import { getInitials, formatDate, shouldShowTimestamp, getLastMessagePreview } from '../../Utilities/ChatHelpers';
import { ChatContext } from '../../context/ChatContext';
import useAuth from '../../Hooks/useAuth';

export default function ConversationList({ 
    conversations, 
    onSelectConversation, 
    selectedConversationId,
    onlineUsers 
}) {
    const { selectConversation } = useContext(ChatContext);
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredConversations = conversations.filter(conv =>
        conv.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.otherUserEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectConversation = (conversation) => {
        selectConversation(conversation);
        onSelectConversation(conversation);
    };

    if (conversations.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-6">
                <div className="text-center max-w-xs">
                    <p className="text-gray-800 font-semibold text-sm mb-1">No active chats</p>
                    <p className="text-gray-500 text-xs">
                        Chats appear here when you have a deal in progress with an owner or seeker.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Search Header */}
            <div className="p-3 border-b border-gray-100 bg-gray-50">
                <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 rounded-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                />
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                    <div
                        key={conversation._id}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`px-3 py-3 border-b border-gray-100 cursor-pointer transition-all hover:bg-white ${
                            selectedConversationId === conversation._id
                                ? 'bg-white border-l-4 border-l-orange-500'
                                : ''
                        }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center text-white font-semibold text-xs">
                                        {getInitials(conversation.otherUserName)}
                                    </div>
                                    {onlineUsers?.includes(conversation.otherUserEmail) && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                    )}
                                </div>

                                {/* Name and Email */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                                        {conversation.otherUserName}
                                        {conversation.otherUserVerified && (
                                            <span className="ml-1 text-blue-500" title="Verified">✓</span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-500 truncate">
                                        {conversation.otherUserEmail}
                                    </p>
                                </div>
                            </div>

                            {/* Time */}
                            {conversation.lastMessageTime && (
                                <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                    {formatDate(conversation.lastMessageTime)}
                                </span>
                            )}
                        </div>

                        {/* Last Message Preview */}
                        <p className="text-xs text-gray-600 truncate pl-12">
                            {getLastMessagePreview(
                                conversation.lastMessage,
                                conversation.lastMessageSender,
                                user?.email
                            )}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
