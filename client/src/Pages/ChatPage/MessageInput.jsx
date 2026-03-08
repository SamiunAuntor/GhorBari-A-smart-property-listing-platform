import { useState, useRef, useEffect } from 'react';
import { getSocket } from '../../Utilities/socketClient';
import { showToast } from '../../Utilities/ToastMessage';

export default function MessageInput({
    conversationId,
    onSendMessage,
    disabled = false,
    isConnected = true
}) {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
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

        const hasText = message.trim().length > 0;
        const hasAttachments = attachments.length > 0;

        if ((!hasText && !hasAttachments) || !conversationId || disabled) return;

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

            await onSendMessage(content, attachments);
            setAttachments([]);
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

    const handleImageClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !conversationId || disabled) return;

        try {
            setIsUploading(true); // START LOADING
            const { uploadImageToImgBB } = await import('../../Utilities/UploadImage');
            const url = await uploadImageToImgBB(file);

            if (url) {
                setAttachments((prev) => [...prev, url]);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Failed to upload image. Please try again.', 'error');
        } finally {
            setIsUploading(false); // STOP LOADING
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveAttachment = (urlToRemove) => {
        setAttachments((prev) => prev.filter((url) => url !== urlToRemove));
    };

    return (
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-gray-100 bg-white">
            <div className="flex gap-2 sm:gap-3 items-end">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleTyping}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={disabled}
                    rows="1"
                    className="flex-1 resize-none overflow-hidden border border-gray-200 rounded-2xl px-3 sm:px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed max-h-32"
                />

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleImageClick}
                        disabled={disabled || isUploading} // Added isUploading check
                        className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-orange-500 transition-colors disabled:opacity-50"
                        title="Attach image"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                        >
                            <path d="M21.44 11.05 12.97 19.5a5 5 0 0 1-7.07-7.07l8.49-8.49a3.5 3.5 0 0 1 4.95 4.95l-8.49 8.49a2 2 0 0 1-2.83-2.83l7.78-7.78" />
                        </svg>
                    </button>

                    <button
                        type="submit"
                        disabled={(!message.trim() && attachments.length === 0) || disabled || isUploading} // Added isUploading check
                        className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl px-4 sm:px-5 py-2 text-sm font-semibold transition-colors flex-shrink-0"
                    >
                        Send
                    </button>
                </div>
            </div>

            {/* PREVIEW AREA - Cleaned and Merged */}
            <div className="mt-2 space-y-2">
                {(attachments.length > 0 || isUploading) && (
                    <div className="flex flex-wrap gap-2">
                        {attachments.map((url) => (
                            <div
                                key={url}
                                className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-200 bg-gray-50"
                            >
                                <img
                                    src={url}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAttachment(url)}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-gray-600 border border-gray-300 flex items-center justify-center text-[10px] hover:bg-red-500 hover:text-white transition-colors"
                                    title="Remove"
                                >
                                    ×
                                </button>
                            </div>
                        ))}

                        {/* Uploading Placeholder */}
                        {isUploading && (
                            <div className="w-16 h-16 rounded-md border border-dashed border-orange-300 bg-orange-50 flex flex-col items-center justify-center animate-pulse">
                                <span className="text-[10px] text-orange-600 font-medium text-center px-1">Uploading...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Info */}
                <div className="flex flex-wrap justify-between items-center gap-1 text-[11px] text-gray-500">
                    <span>Press Enter to send • Shift+Enter for new line</span>
                    {!isConnected && (
                        <span className="w-full text-amber-600">Offline — messages will be delivered when the connection is restored.</span>
                    )}
                </div>
            </div>
        </form>
    );
}
