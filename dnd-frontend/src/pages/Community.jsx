import React, { useEffect, useMemo, useState } from "react";
import {
    createCommunityInvite,
    getChannelMessages,
    getServer,
    getServerMembers,
    getServers,
    getUser,
    joinVoiceChannel,
    leaveVoiceChannel,
    sendChannelMessage
} from "../Api";
import "../assets/styles/Community.css";

const channelTypes = {
    text: 0,
    voice: 1,
    category: 2,
    news: 3
};

const emojis = [":)", ":D", ":fire:", ":dice:", ":map:", ":shield:", ":wand:", ":star:"];

const isTextChannel = (type) => type === channelTypes.text || type === channelTypes.news;

const getChannelLabel = (channel) => {
    if (channel.type === channelTypes.voice) return "VOICE";
    if (channel.type === channelTypes.news) return "NEWS";
    return "TEXT";
};

const CommunityPage = () => {
    const token = localStorage.getItem("token");
    const [servers, setServers] = useState([]);
    const [activeServerId, setActiveServerId] = useState(null);
    const [channels, setChannels] = useState([]);
    const [members, setMembers] = useState([]);
    const [messagesByChannel, setMessagesByChannel] = useState({});
    const [activeChannelId, setActiveChannelId] = useState(null);
    const [messageInput, setMessageInput] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [me, setMe] = useState(null);
    const [inviteCode, setInviteCode] = useState("");
    const [voiceChannelId, setVoiceChannelId] = useState(null);
    const [voiceLoadingId, setVoiceLoadingId] = useState(null);

    useEffect(() => {
        if (!token) {
            setError("Missing auth token.");
            setLoading(false);
            return;
        }

        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const [meRes, serversRes] = await Promise.all([
                    getUser(token),
                    getServers(token)
                ]);
                setMe(meRes.data);
                const serverList = serversRes.data || [];
                setServers(serverList);
                if (serverList.length > 0) {
                    setActiveServerId(serverList[0].id);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load servers.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [token]);

    useEffect(() => {
        if (!activeServerId || !token) {
            return;
        }

        const loadServer = async () => {
            setLoading(true);
            setError("");
            try {
                const [serverRes, membersRes] = await Promise.all([
                    getServer(activeServerId, token),
                    getServerMembers(activeServerId, token)
                ]);
                const server = serverRes.data;
                setChannels(server.channels || []);
                setMembers(membersRes.data || []);

                const preferred = (server.channels || []).find(
                    (channel) => isTextChannel(channel.type) && !channel.isArchived
                );
                const fallback = (server.channels || []).find((channel) => !channel.isArchived);
                const nextChannel = preferred || fallback || null;
                setActiveChannelId(nextChannel ? nextChannel.id : null);
            } catch (err) {
                console.error(err);
                setError("Failed to load server details.");
            } finally {
                setLoading(false);
            }
        };

        loadServer();
    }, [activeServerId, token]);

    useEffect(() => {
        if (!activeChannelId || !token) {
            return;
        }

        const channel = channels.find((item) => item.id === activeChannelId);
        if (!channel || !isTextChannel(channel.type)) {
            return;
        }

        const loadMessages = async () => {
            try {
                const res = await getChannelMessages(activeChannelId, token);
                setMessagesByChannel((prev) => ({
                    ...prev,
                    [activeChannelId]: res.data || []
                }));
            } catch (err) {
                console.error(err);
            }
        };

        loadMessages();
    }, [activeChannelId, channels, token]);

    const activeServer = useMemo(
        () => servers.find((server) => server.id === activeServerId) || null,
        [servers, activeServerId]
    );

    const channelGroups = useMemo(() => {
        const visibleChannels = channels.filter((channel) => !channel.isArchived);
        const categories = visibleChannels.filter((channel) => channel.type === channelTypes.category);
        const nonCategories = visibleChannels.filter(
            (channel) => channel.type !== channelTypes.category
        );

        if (categories.length > 0) {
            const groups = categories.map((category) => ({
                name: category.name,
                channels: nonCategories.filter((channel) => channel.parentId === category.id)
            }));
            const ungrouped = nonCategories.filter((channel) => !channel.parentId);
            if (ungrouped.length > 0) {
                groups.push({ name: "Other", channels: ungrouped });
            }
            return groups;
        }

        const textChannels = nonCategories.filter(
            (channel) => channel.type === channelTypes.text || channel.type === channelTypes.news
        );
        const voiceChannels = nonCategories.filter((channel) => channel.type === channelTypes.voice);
        return [
            { name: "Text Channels", channels: textChannels },
            { name: "Voice", channels: voiceChannels }
        ].filter((group) => group.channels.length > 0);
    }, [channels]);

    const activeChannel = useMemo(
        () => channels.find((channel) => channel.id === activeChannelId) || null,
        [channels, activeChannelId]
    );

    const activeMessages = messagesByChannel[activeChannelId] || [];

    const myRole = useMemo(() => {
        if (!me) return "Member";
        const member = members.find((m) => m.userId === me.id);
        return member?.role || "Member";
    }, [members, me]);

    const isReadOnly =
        activeChannel &&
        (activeChannel.isReadOnly || activeChannel.type === channelTypes.news) &&
        myRole === "Member";

    const handleSend = async () => {
        if (!activeChannel || !isTextChannel(activeChannel.type)) {
            return;
        }
        if (isReadOnly) {
            return;
        }

        const trimmed = messageInput.trim();
        if (!trimmed) {
            return;
        }

        try {
            const res = await sendChannelMessage(activeChannel.id, trimmed, token);
            setMessagesByChannel((prev) => ({
                ...prev,
                [activeChannel.id]: [...(prev[activeChannel.id] || []), res.data]
            }));
            setMessageInput("");
        } catch (err) {
            console.error(err);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const handleEmojiPick = (emoji) => {
        setMessageInput((prev) => `${prev}${emoji}`);
        setShowEmoji(false);
    };

    const handleInvite = async () => {
        if (!activeServerId) return;
        try {
            const res = await createCommunityInvite(activeServerId, {}, token);
            setInviteCode(res.data.code);
        } catch (err) {
            console.error(err);
        }
    };

    const handleVoiceToggle = async (channelId) => {
        if (!token) return;
        setVoiceLoadingId(channelId);
        try {
            if (voiceChannelId === channelId) {
                await leaveVoiceChannel(channelId, token);
                setVoiceChannelId(null);
            } else {
                if (voiceChannelId) {
                    await leaveVoiceChannel(voiceChannelId, token);
                }
                await joinVoiceChannel(channelId, token);
                setVoiceChannelId(channelId);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setVoiceLoadingId(null);
        }
    };

    if (loading) {
        return (
            <div className="community-hub">
                <div className="community-shell">
                    <main className="community-chat">Loading community...</main>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="community-hub">
                <div className="community-shell">
                    <main className="community-chat">{error}</main>
                </div>
            </div>
        );
    }

    return (
        <div className="community-hub">
            <div className="community-shell">
                <aside className="community-servers">
                    <div className="community-servers-header">Servers</div>
                    {servers.map((server) => (
                        <button
                            key={server.id}
                            className={`server-pill ${server.id === activeServerId ? "is-active" : ""}`}
                            onClick={() => {
                                setActiveServerId(server.id);
                                setActiveChannelId(null);
                                setMessagesByChannel({});
                                setInviteCode("");
                            }}
                            title={server.name}
                        >
                            <span>{server.name.slice(0, 2).toUpperCase()}</span>
                        </button>
                    ))}
                    <button className="server-pill add" disabled title="Create server">
                        +
                    </button>
                </aside>

                <aside className="community-channels">
                    <div className="channel-header">
                        <div>
                            <h2>{activeServer?.name || "Server"}</h2>
                            <p>{activeServer?.description || "Community homebase."}</p>
                        </div>
                        <button className="channel-header-action" onClick={handleInvite}>
                            Invite
                        </button>
                    </div>

                    {inviteCode && (
                        <div className="voice-card">
                            <div>
                                <h4>Invite Code</h4>
                                <p>{inviteCode}</p>
                            </div>
                        </div>
                    )}

                    {channelGroups.map((group) => (
                        <div key={group.name} className="channel-group">
                            <h3>{group.name}</h3>
                            <div className="channel-list">
                                {group.channels.map((channel) => (
                                    <button
                                        key={channel.id}
                                        className={`channel-item ${channel.type === channelTypes.voice ? "voice" : channel.type === channelTypes.news ? "news" : "text"} ${channel.id === activeChannelId ? "is-active" : ""}`}
                                        onClick={() => setActiveChannelId(channel.id)}
                                    >
                                        <span className="channel-prefix">
                                            {channel.type === channelTypes.voice
                                                ? "V"
                                                : channel.type === channelTypes.news
                                                ? "!"
                                                : "#"}
                                        </span>
                                        <span className="channel-name">{channel.name}</span>
                                        {channel.type === channelTypes.news && (
                                            <span className="channel-badge">NEWS</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="voice-block">
                        <h3>Voice Activity</h3>
                        {channels
                            .filter((channel) => channel.type === channelTypes.voice)
                            .map((voice) => (
                                <div key={voice.id} className="voice-card">
                                    <div>
                                        <h4>{voice.name}</h4>
                                        <p>{voice.topic || "Voice channel"}</p>
                                    </div>
                                    <button
                                        className="voice-action"
                                        onClick={() => handleVoiceToggle(voice.id)}
                                        disabled={voiceLoadingId === voice.id}
                                    >
                                        {voiceChannelId === voice.id ? "Leave" : "Join"}
                                    </button>
                                </div>
                            ))}
                    </div>
                </aside>

                <main className="community-chat">
                    <header className="chat-header">
                        <div>
                            <p className="chat-type">{activeChannel ? getChannelLabel(activeChannel) : "CHANNEL"}</p>
                            <h1>
                                {activeChannel
                                    ? activeChannel.type === channelTypes.voice
                                        ? "Voice Room"
                                        : `#${activeChannel.name}`
                                    : "Select a channel"}
                            </h1>
                            <span>{activeChannel?.topic || "Stay in sync with your party."}</span>
                        </div>
                        <div className="chat-actions">
                            <button className="chat-action">Pins</button>
                            <button className="chat-action">Search</button>
                            <button className="chat-action">Settings</button>
                        </div>
                    </header>

                    <div className="chat-feed">
                        {activeChannel && activeChannel.type === channelTypes.voice && (
                            <div className="message-row">
                                <div className="message-body">
                                    <p>Join the voice channel to speak with your party.</p>
                                </div>
                            </div>
                        )}

                        {activeChannel &&
                            isTextChannel(activeChannel.type) &&
                            activeMessages.map((message) => (
                                <div key={message.id} className="message-row">
                                    <div className="message-avatar">
                                        {(message.senderName || "U").slice(0, 2)}
                                    </div>
                                    <div className="message-body">
                                        <div className="message-meta">
                                            <span className="message-author">{message.senderName}</span>
                                            <span className="message-role">
                                                {message.senderId === activeServer?.ownerId ? "Owner" : "Member"}
                                            </span>
                                            <span className="message-time">
                                                {message.timestamp
                                                    ? new Date(message.timestamp).toLocaleTimeString("en-US", {
                                                          hour: "2-digit",
                                                          minute: "2-digit"
                                                      })
                                                    : ""}
                                            </span>
                                        </div>
                                        <p>{message.isDeleted ? "Message deleted." : message.content}</p>
                                    </div>
                                </div>
                            ))}
                    </div>

                    <div className="chat-composer">
                        <div className="composer-input">
                            <textarea
                                value={messageInput}
                                onChange={(event) => setMessageInput(event.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    activeChannel
                                        ? `Message #${activeChannel.name}`
                                        : "Select a channel"
                                }
                                disabled={!activeChannel || !isTextChannel(activeChannel.type) || isReadOnly}
                            />
                            <button
                                className="emoji-toggle"
                                onClick={() => setShowEmoji((prev) => !prev)}
                                disabled={!activeChannel || !isTextChannel(activeChannel.type) || isReadOnly}
                            >
                                :)
                            </button>
                            {showEmoji && (
                                <div className="emoji-panel">
                                    {emojis.map((emoji) => (
                                        <button
                                            key={emoji}
                                            className="emoji"
                                            onClick={() => handleEmojiPick(emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            className="send-action"
                            onClick={handleSend}
                            disabled={!activeChannel || !isTextChannel(activeChannel.type) || isReadOnly}
                        >
                            Send
                        </button>
                    </div>
                </main>

                <aside className="community-members">
                    <h3>Members</h3>
                    <div className="member-list">
                        {members.map((member) => (
                            <div key={member.userId} className="member-row">
                                <div className={`member-avatar ${member.isActive ? "active" : "away"}`}>
                                    {member.username.slice(0, 2)}
                                </div>
                                <div>
                                    <p className="member-name">{member.username}</p>
                                    <span className="member-role">{member.role}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="member-panel">
                        <h4>Voice Status</h4>
                        <div className="speaker-row">
                            <span className="speaker-dot" />
                            <div>
                                <p>{voiceChannelId ? "You" : "No one speaking"}</p>
                                <span>{voiceChannelId ? "Connected" : "Idle"}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CommunityPage;
