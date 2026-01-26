import React, { useEffect, useRef, useState } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { API_BASE, getDmHistory } from "../assets/api/dndtoolapi";
import "../assets/styles/ChatPopUp.css";

export default function DirectMessagePopup({ token, meId, friend, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [connecting, setConnecting] = useState(true);
    const [error, setError] = useState("");
    const connectionRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!token || !friend?.id) return;
        let cancelled = false;

        setError("");
        getDmHistory(token, friend.id)
            .then(res => {
                if (cancelled) return;
                setMessages(res.data || []);
            })
            .catch(err => {
                if (cancelled) return;
                console.error("Error loading DM history:", err);
                setError("Failed to load messages.");
            });

        return () => {
            cancelled = true;
        };
    }, [token, friend?.id]);

    useEffect(() => {
        if (!token || !friend?.id) return;

        const connection = new HubConnectionBuilder()
            .withUrl(`${API_BASE}/hubs/dm`, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Error)
            .build();

        connectionRef.current = connection;

        connection.on("dmReceived", (msg) => {
            if (!msg) return;
            const senderId = msg.senderId;
            const receiverId = msg.receiverId;
            const isRelevant = meId == null
                ? (senderId === friend.id || receiverId === friend.id)
                : ((senderId === friend.id && receiverId === meId) ||
                   (senderId === meId && receiverId === friend.id));

            if (!isRelevant) return;

            setMessages((prev) => [...prev, msg]);
        });

        connection
            .start()
            .then(() => setConnecting(false))
            .catch((err) => {
                console.error("SignalR connection error:", err);
                setError("Failed to connect to chat.");
                setConnecting(false);
            });

        return () => {
            connection.stop().catch(() => {});
            connectionRef.current = null;
        };
    }, [token, friend?.id, meId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || !connectionRef.current) return;
        try {
            await connectionRef.current.invoke("SendDm", friend.id, newMessage.trim());
            setNewMessage("");
        } catch (err) {
            console.error("Error sending message:", err);
            setError("Failed to send message.");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleSend();
    };

    const renderSender = (msg) => {
        if (meId != null && msg.senderId === meId) return "You";
        return msg.senderUsername || friend.username || "Friend";
    };

    return (
        <div className="chat-popup">
            <div className="chat-header">
                <span>Chat with {friend?.username || "Friend"}</span>
                <button onClick={onClose}>-</button>
            </div>
            <div className="chat-messages">
                {connecting && <div className="chat-message"><span className="content">Connecting...</span></div>}
                {error && <div className="chat-message"><span className="content">{error}</span></div>}
                {messages.map((msg, index) => {
                    const isSelf = msg.senderId === meId;
                    return (
                        <div key={`${msg.sentAt || index}-${index}`} className={`chat-message ${isSelf ? "self" : "friend"}`}>
                            <span className="sender">{renderSender(msg)}</span>
                            <span className="content">{msg.content}</span>
                        </div>
                    );
                })}
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

