import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useChat } from '../../Hooks/useChat';
import { useSocket } from '../../Hooks/useSocket';
import useAuth from '../../Hooks/useAuth';
import ChatHeader from './ChatHeader';
import ConversationList from './ConversationList';
import ChatMessages from './ChatMessages';
import MessageInput from './MessageInput';
import { ChatProvider } from '../../context/ChatContext';
import { showToast } from '../../Utilities/ToastMessage';

function ChatWindowContent() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const applicationId = searchParams.get('applicationId');
    const { socket, isConnected, onlineUsers } = useSocket();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [showConversationList, setShowConversationList] = useState(true);
    const openedFromApplication = useRef(false);
    const {
        conversations,
        messages,
        loading,
        fetchConversations,
        fetchMessages,
        sendMessage,
        deleteConversation,
        markMessagesAsRead,
        listenToMessages,
        createConversationFromApplication
    } = useChat();

    // Open conversation from applicationId (e.g. /chat?applicationId=xxx)
    useEffect(() => {
        if (!applicationId || !user || openedFromApplication.current) return;
        openedFromApplication.current = true;
        createConversationFromApplication(applicationId)
            .then((conversation) => {
                const conv = { ...conversation, _id: conversation._id?.toString?.() || conversation._id };
                setSelectedConversation(conv);
                setShowConversationList(false);
                setSearchParams({}, { replace: true });
            })
            .catch(() => {})
            .finally(() => {
                openedFromApplication.current = false;
            });
    }, [applicationId, user, createConversationFromApplication, setSearchParams]);

    // Fetch conversations on mount
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Listen to socket messages
    useEffect(() => {
        if (!selectedConversation?._id || !socket?.connected) return;

        const unsubscribe = listenToMessages(selectedConversation._id, (newMessage) => {
            console.log('New message received:', newMessage);
        });

        return unsubscribe;
    }, [selectedConversation?._id, socket?.connected, listenToMessages]);

    // Fetch messages when conversation changes
    useEffect(() => {
        if (!selectedConversation?._id) return;

        fetchMessages(selectedConversation._id);
        markMessagesAsRead(selectedConversation._id);
    }, [selectedConversation?._id, fetchMessages, markMessagesAsRead]);

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        setShowConversationList(false); // Hide list on mobile when selecting
    };

    const handleSendMessage = async (content) => {
        try {
            await sendMessage(selectedConversation._id, content);
            // Refresh conversation list to update last message
            await fetchConversations();
        } catch (error) {
            showToast(`Failed to send message: ${error.message}`, 'error');
        }
    };

    const handleDeleteConversation = async () => {
        try {
            await deleteConversation(selectedConversation._id);
            setSelectedConversation(null);
            setShowConversationList(true);
            await fetchConversations();
            showToast('Conversation deleted', 'success');
            return true;
        } catch (error) {
            showToast(`Failed to delete conversation: ${error.message}`, 'error');
            return false;
        }
    };

    const handleBackClick = () => {
        setShowConversationList(true);
    };

    return (
        <div className="w-11/12 mx-auto my-6 h-[80vh] flex flex-col lg:flex-row bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            {/* Connection Status */}
            {!isConnected && (
                <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
                    <p>⚠️ Connection to chat server lost. Reconnecting...</p>
                </div>
            )}

            {/* Conversations Sidebar */}
            <div className={`w-full lg:w-80 lg:border-r border-gray-100 bg-gray-50 flex flex-col ${
                showConversationList ? '' : 'hidden lg:flex'
            }`}>
                <div className="p-4 border-b border-gray-100 bg-white">
                    <h1 className="text-lg font-bold text-gray-900">Messages</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        {isConnected ? '✓ Connected' : '⚠ Offline'} · Chats appear after a deal is in progress
                    </p>
                </div>
                <ConversationList
                    conversations={conversations}
                    selectedConversationId={selectedConversation?._id}
                    onSelectConversation={handleSelectConversation}
                    onlineUsers={onlineUsers}
                />
            </div>

            {/* Chat Window */}
            <div className={`flex-1 flex flex-col ${
                showConversationList ? 'hidden lg:flex' : 'flex'
            }`}>
                {selectedConversation ? (
                    <>
                        <ChatHeader
                            conversation={selectedConversation}
                            onlineUsers={onlineUsers}
                            onDeleteConversation={handleDeleteConversation}
                            onBack={handleBackClick}
                        />
                        <ChatMessages
                            messages={messages}
                            loading={loading}
                            onlineUsers={onlineUsers}
                            selectedConversation={selectedConversation}
                        />
                        <MessageInput
                            conversationId={selectedConversation._id}
                            onSendMessage={handleSendMessage}
                            disabled={false}
                            isConnected={isConnected}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center max-w-sm px-4">
                            <p className="text-gray-500 text-lg mb-2">Select a chat</p>
                            <p className="text-gray-400 text-sm">Choose a conversation from the list to see all your sent and received messages</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <ChatProvider>
            <ChatWindowContent />
        </ChatProvider>
    );
}
