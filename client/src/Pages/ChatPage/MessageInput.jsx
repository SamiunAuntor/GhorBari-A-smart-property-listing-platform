import { useState, useRef, useEffect } from 'react';
import { getSocket } from '../../Utilities/socketClient';

export default function MessageInput({
    conversationId,
    onSendMessage,
    disabled = false,
    isConnected = true
}) {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const socket = getSocket();

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [message]);

    // Emit typing event
    const handleTyping = (e) => {
        const value = e.target.value;
        setMessage(value);

        if (!isTyping && socket?.connected) {
            setIsTyping(true);
            socket.emit('typing:start', conversationId);

            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                socket.emit('typing:stop', conversationId);
            }, 3000);
        } else if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                socket.emit('typing:stop', conversationId);
            }, 3000);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!message.trim() || !conversationId || disabled) return;

        try {
            const content = message.trim();
            setMessage('');

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }

            // Stop typing indicator
            if (isTyping) {
                setIsTyping(false);
                socket?.emit('typing:stop', conversationId);
            }

            await onSendMessage(content);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessage(message); // Restore message on error
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    return (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
            <div className="flex gap-3 items-end">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleTyping}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={disabled}
                    rows="1"
                    className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed max-h-32"
                />

                <button
                    type="submit"
                    disabled={!message.trim() || disabled}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl px-5 py-2 text-sm font-semibold transition-colors flex-shrink-0"
                >
                    Send
                </button>
            </div>

            {/* Helper text and offline note */}
            <div className="mt-2 flex flex-wrap justify-between items-center gap-1 text-[11px] text-gray-500">
                <span>Press Enter to send • Shift+Enter for new line</span>
                {!isConnected && (
                    <span className="w-full text-amber-600">Offline — messages will be delivered when the connection is restored.</span>
                )}
            </div>
        </form>
    );
}
