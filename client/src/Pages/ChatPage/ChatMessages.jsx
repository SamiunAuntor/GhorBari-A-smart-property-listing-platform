import useAuth from '../../Hooks/useAuth';
import { getInitials, formatTime, shouldShowTimestamp } from '../../Utilities/ChatHelpers';
import { useEffect, useRef } from 'react';

export default function ChatMessages({
    messages,
    loading,
    onlineUsers,
    selectedConversation
}) {
    const { user } = useAuth();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!selectedConversation) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-600 text-sm">Select a conversation to see messages</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-700 font-medium mb-1 text-sm">No messages yet</p>
                    <p className="text-gray-500 text-xs">Send a message to start the conversation</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-gray-50 p-3 sm:p-4 pb-2">
            {messages.map((message, index) => {
                const previousMessage = index > 0 ? messages[index - 1] : null;
                const isOwnMessage = message.senderEmail === user?.email;
                const showTimestamp = shouldShowTimestamp(message, previousMessage);
                const showSenderName = !isOwnMessage && (index === 0 || messages[index - 1]?.senderEmail !== message.senderEmail);

                return (
                    <div key={message._id} className="mb-1">
                        {showTimestamp && (
                            <div className="flex justify-center my-3">
                                <span className="text-xs text-gray-500 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                                    {formatTime(message.createdAt)}
                                </span>
                            </div>
                        )}

                        <div className={`flex gap-2 min-w-0 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            {!isOwnMessage && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-semibold mt-0.5">
                                    {getInitials(message.senderName)}
                                </div>
                            )}

                            <div className={`flex flex-col min-w-0 max-w-[75%] sm:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                {showSenderName && (
                                    <span className="text-xs font-medium text-green-800 mb-0.5 ml-1">{message.senderName}</span>
                                )}
                                <div
                                    className={`rounded-lg px-3 py-2 break-words shadow-md ${
                                        isOwnMessage
                                            ? 'bg-[#d9fdd3] text-gray-900 rounded-br-none rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                                            : 'bg-white text-gray-900 rounded-bl-none rounded-tl-lg rounded-tr-lg rounded-br-lg'
                                    }`}
                                >
                                    {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                                        <div className="mb-1 space-y-1 max-w-full">
                                            {message.attachments.map((url) => (
                                                <a
                                                    key={url}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block max-w-full"
                                                >
                                                    <img
                                                        src={url}
                                                        alt="Attachment"
                                                        className="block w-full max-w-full sm:max-w-sm rounded-md border border-gray-200"
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    {message.content && (
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    )}
                                    <div className={`flex items-center gap-1 mt-0.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                        <span className="text-[10px] text-gray-500">
                                            {formatTime(message.createdAt)}
                                        </span>
                                        {isOwnMessage && message.isRead && (
                                            <span className="text-[10px] text-blue-500" title="Read">✓✓</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
}
