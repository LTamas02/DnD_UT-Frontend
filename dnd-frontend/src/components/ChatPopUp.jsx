import React, { useState, useEffect, useRef } from "react";
import { getMessages, sendMessage } from "../Api"; // we will create these
import "../assets/styles/ChatPopUp.css"; // Create appropriate CSS for styling

export default function ChatPopup({ roomId, username, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000); // refresh every 2 sec
        return () => clearInterval(interval);
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await getMessages(roomId);
            setMessages(res.data);
            scrollToBottom();
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        try {
            await sendMessage(roomId, newMessage);
            setNewMessage("");
            fetchMessages();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleSend();
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="chat-popup">
            <div className="chat-header">
                <span>Chat with {username}</span>
                <button onClick={onClose}>×</button>
            </div>
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.senderUsername === username ? "friend" : "self"}`}>
                        <span className="sender">{msg.senderUsername}</span>
                        <span className="content">{msg.content}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
    );
}
