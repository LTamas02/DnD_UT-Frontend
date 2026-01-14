import React, { useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import api, {
    addCommunityReaction,
    createCommunityInvite,
    createServer,
    createServerChannel,
    deleteServer,
    deleteServerChannel,
    getChannelMessages,
    getCommunityInvites,
    getServer,
    getServerMembers,
    getServerChannels,
    getServers,
    getUser,
    joinCommunityInvite,
    joinVoiceChannel,
    leaveVoiceChannel,
    removeCommunityReaction,
    sendChannelMessage,
    updateServer,
    updateServerChannel,
    updateVoiceState
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
    const hubBase = useMemo(() => {
        const base = api.defaults.baseURL || "";
        return base.replace(/\/api\/?$/, "");
    }, []);
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
    const [createName, setCreateName] = useState("");
    const [createDescription, setCreateDescription] = useState("");
    const [createPrivate, setCreatePrivate] = useState(true);
    const [inviteInput, setInviteInput] = useState("");
    const [channelName, setChannelName] = useState("");
    const [channelType, setChannelType] = useState("text");
    const [channelTopic, setChannelTopic] = useState("");
    const [channelReadOnly, setChannelReadOnly] = useState(false);
    const [inviteList, setInviteList] = useState([]);
    const [serverName, setServerName] = useState("");
    const [serverDescription, setServerDescription] = useState("");
    const [serverPrivate, setServerPrivate] = useState(true);
    const [voiceMuted, setVoiceMuted] = useState(false);
    const [voiceDeafened, setVoiceDeafened] = useState(false);
    const hubRef = useRef(null);
    const voiceHubRef = useRef(null);
    const [showServerForm, setShowServerForm] = useState(false);
    const [showChannelForm, setShowChannelForm] = useState(false);

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
        if (!token || !hubBase) {
            return;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${hubBase}/hubs/community`, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        connection.on("messageReceived", (message) => {
            setMessagesByChannel((prev) => {
                const list = prev[message.channelId] || [];
                return {
                    ...prev,
                    [message.channelId]: [
                        ...list,
                        { ...message, reactions: [], myReactions: [] }
                    ]
                };
            });
        });

        connection.start().catch((err) => console.error(err));
        hubRef.current = connection;

        return () => {
            connection.stop();
            hubRef.current = null;
        };
    }, [hubBase, token]);

    useEffect(() => {
        if (!token || !hubBase) {
            return;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${hubBase}/hubs/voice`, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        connection.start().catch((err) => console.error(err));
        voiceHubRef.current = connection;

        return () => {
            connection.stop();
            voiceHubRef.current = null;
        };
    }, [hubBase, token]);

    useEffect(() => {
        if (!activeServerId || !token) {
            return;
        }

        const loadServer = async () => {
            setLoading(true);
            setError("");
            try {
                const [serverRes, membersRes, channelsRes] = await Promise.all([
                    getServer(activeServerId, token),
                    getServerMembers(activeServerId, token),
                    getServerChannels(activeServerId, token)
                ]);
                const server = serverRes.data;
                const channelList = channelsRes.data || server.channels || [];
                setChannels(channelList);
                setMembers(membersRes.data || []);

                const preferred = channelList.find(
                    (channel) => isTextChannel(channel.type) && !channel.isArchived
                );
                const fallback = channelList.find((channel) => !channel.isArchived);
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

    useEffect(() => {
        const hub = hubRef.current;
        if (!hub || !activeChannelId) {
            return;
        }

        hub.invoke("JoinChannel", activeChannelId).catch((err) => console.error(err));
        return () => {
            hub.invoke("LeaveChannel", activeChannelId).catch(() => null);
        };
    }, [activeChannelId]);

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
    const canManage = myRole !== "Member";
    const canDeleteServer = myRole === "Owner";

    useEffect(() => {
        if (activeServer) {
            setServerName(activeServer.name || "");
            setServerDescription(activeServer.description || "");
            setServerPrivate(activeServer.isPrivate ?? true);
        }
    }, [activeServer]);

    useEffect(() => {
        if (!activeServerId || !token) {
            return;
        }
        if (myRole === "Member") {
            setInviteList([]);
            return;
        }
        const loadInvites = async () => {
            try {
                const res = await getCommunityInvites(activeServerId, token);
                setInviteList(res.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        loadInvites();
    }, [activeServerId, myRole, token]);

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
            if (!hubRef.current || hubRef.current.state !== "Connected") {
                setMessagesByChannel((prev) => ({
                    ...prev,
                    [activeChannel.id]: [...(prev[activeChannel.id] || []), res.data]
                }));
            }
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
            if (myRole !== "Member") {
                const inviteRes = await getCommunityInvites(activeServerId, token);
                setInviteList(inviteRes.data || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleJoinInvite = async () => {
        if (!token || !inviteInput.trim()) return;
        try {
            setError("");
            await joinCommunityInvite(inviteInput.trim(), token);
            const serversRes = await getServers(token);
            const serverList = serversRes.data || [];
            setServers(serverList);
            if (serverList.length > 0) {
                const newest = serverList[0];
                setActiveServerId(newest.id);
            }
            setInviteInput("");
        } catch (err) {
            console.error(err);
            setError("Invite code invalid or expired.");
        }
    };

    const handleCreateChannel = async () => {
        if (!token || !activeServerId) return;
        const trimmed = channelName.trim();
        if (!trimmed) {
            return;
        }
        try {
            setError("");
            const typeValue = channelTypes[channelType] ?? channelTypes.text;
            const res = await createServerChannel(
                activeServerId,
                {
                    name: trimmed,
                    type: typeValue,
                    topic: channelTopic.trim() || null,
                    isReadOnly: channelReadOnly
                },
                token
            );
            setChannels((prev) => [...prev, res.data]);
            setChannelName("");
            setChannelTopic("");
            setChannelReadOnly(false);
            setActiveChannelId(res.data.id);
        } catch (err) {
            console.error(err);
            setError("Failed to create channel.");
        }
    };

    const handleArchiveChannel = async () => {
        if (!token || !activeServerId || !activeChannel) return;
        try {
            const res = await updateServerChannel(
                activeServerId,
                activeChannel.id,
                { isArchived: !activeChannel.isArchived },
                token
            );
            setChannels((prev) =>
                prev.map((ch) => (ch.id === res.data.id ? res.data : ch))
            );
        } catch (err) {
            console.error(err);
            setError("Failed to update channel.");
        }
    };

    const handleDeleteChannel = async () => {
        if (!token || !activeServerId || !activeChannel) return;
        try {
            await deleteServerChannel(activeServerId, activeChannel.id, token);
            setChannels((prev) => prev.filter((ch) => ch.id !== activeChannel.id));
            setActiveChannelId(null);
        } catch (err) {
            console.error(err);
            setError("Failed to delete channel.");
        }
    };

    const handleUpdateServer = async () => {
        if (!token || !activeServerId) return;
        try {
            setError("");
            await updateServer(
                activeServerId,
                {
                    name: serverName.trim(),
                    description: serverDescription.trim(),
                    isPrivate: serverPrivate
                },
                token
            );
            const res = await getServer(activeServerId, token);
            const updated = res.data;
            setServers((prev) => prev.map((srv) => (srv.id === updated.id ? updated : srv)));
        } catch (err) {
            console.error(err);
            setError("Failed to update server.");
        }
    };

    const handleDeleteServer = async () => {
        if (!token || !activeServerId) return;
        try {
            await deleteServer(activeServerId, token);
            const serversRes = await getServers(token);
            const serverList = serversRes.data || [];
            setServers(serverList);
            setActiveServerId(serverList.length > 0 ? serverList[0].id : null);
        } catch (err) {
            console.error(err);
            setError("Failed to delete server.");
        }
    };

    const toggleReaction = async (messageId, emoji) => {
        if (!token) return;
        try {
            const existing = (messagesByChannel[activeChannelId] || []).find(
                (msg) => msg.id === messageId
            );
            const alreadyReacted = existing?.myReactions?.includes(emoji);
            if (alreadyReacted) {
                await removeCommunityReaction(messageId, emoji, token);
            } else {
                await addCommunityReaction(messageId, emoji, token);
            }
            const res = await getChannelMessages(activeChannelId, token);
            setMessagesByChannel((prev) => ({
                ...prev,
                [activeChannelId]: res.data || []
            }));
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
                if (voiceHubRef.current) {
                    voiceHubRef.current.invoke("LeaveVoice", channelId).catch(() => null);
                }
                setVoiceChannelId(null);
                setVoiceMuted(false);
                setVoiceDeafened(false);
            } else {
                if (voiceChannelId) {
                    await leaveVoiceChannel(voiceChannelId, token);
                    if (voiceHubRef.current) {
                        voiceHubRef.current.invoke("LeaveVoice", voiceChannelId).catch(() => null);
                    }
                }
                await joinVoiceChannel(channelId, token);
                if (voiceHubRef.current) {
                    voiceHubRef.current.invoke("JoinVoice", channelId).catch(() => null);
                }
                setVoiceChannelId(channelId);
                setVoiceMuted(false);
                setVoiceDeafened(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setVoiceLoadingId(null);
        }
    };

    const handleVoiceState = async (nextMuted, nextDeafened) => {
        if (!token || !voiceChannelId) return;
        try {
            await updateVoiceState(
                voiceChannelId,
                {
                    channelId: voiceChannelId,
                    isMuted: nextMuted,
                    isDeafened: nextDeafened,
                    isStreaming: false,
                    joinedAt: new Date().toISOString()
                },
                token
            );
            setVoiceMuted(nextMuted);
            setVoiceDeafened(nextDeafened);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateServer = async () => {
        if (!token) return;
        const trimmed = createName.trim();
        if (!trimmed) {
            return;
        }
        try {
            setError("");
            const res = await createServer(
                {
                    name: trimmed,
                    description: createDescription.trim(),
                    isPrivate: createPrivate
                },
                token
            );
            const newServer = res.data;
            setServers((prev) => [newServer, ...prev]);
            setActiveServerId(newServer.id);
            setCreateName("");
            setCreateDescription("");
            setCreatePrivate(true);
            setShowServerForm(false);
        } catch (err) {
            console.error(err);
            setError("Failed to create server.");
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

    return (
        <div className="community-hub">
            {error && <div className="community-banner">{error}</div>}
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
                    <button
                        className="server-pill add"
                        title="Create server"
                        onClick={() => setShowServerForm((prev) => !prev)}
                    >
                        +
                    </button>
                </aside>

                <aside className="community-channels">
                    <div className="channel-header">
                        <div>
                            <h2>{activeServer?.name || "Server"}</h2>
                            <p>{activeServer?.description || "Community homebase."}</p>
                        </div>
                        <div className="channel-header-actions">
                            <button
                                className="channel-header-action"
                                onClick={handleInvite}
                                disabled={!canManage}
                            >
                                Create Invite
                            </button>
                            <button
                                className="channel-header-action"
                                onClick={() => setShowChannelForm((prev) => !prev)}
                                disabled={!canManage}
                            >
                                New Channel
                            </button>
                        </div>
                    </div>

                    {inviteCode && (
                        <div className="voice-card">
                            <div>
                                <h4>Invite Code</h4>
                                <p>{inviteCode}</p>
                            </div>
                        </div>
                    )}

                    {canManage && inviteList.length > 0 && (
                        <div className="invite-list">
                            <h4>Active Invites</h4>
                            {inviteList.map((invite) => (
                                <div key={invite.code} className="invite-item">
                                    <div>
                                        <p className="invite-code">{invite.code}</p>
                                        <span>
                                            Uses {invite.uses}/{invite.maxUses ?? "inf"}
                                        </span>
                                    </div>
                                    <span>
                                        {invite.expiresAt
                                            ? new Date(invite.expiresAt).toLocaleDateString()
                                            : "No expiry"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="invite-join">
                        <label className="community-label" htmlFor="invite-code">
                            Join with invite
                        </label>
                        <div className="invite-row">
                            <input
                                id="invite-code"
                                className="community-input"
                                value={inviteInput}
                                onChange={(event) => setInviteInput(event.target.value)}
                                placeholder="Invite code"
                            />
                            <button className="community-cta" onClick={handleJoinInvite}>
                                Join
                            </button>
                        </div>
                    </div>

                    {showChannelForm && (
                        <div className="channel-create">
                            <label className="community-label" htmlFor="channel-name">
                                Create channel
                            </label>
                            <input
                                id="channel-name"
                                className="community-input"
                                value={channelName}
                                onChange={(event) => setChannelName(event.target.value)}
                                placeholder="new-channel"
                            />
                            <div className="channel-create-row">
                                <select
                                    className="community-input"
                                    value={channelType}
                                    onChange={(event) => setChannelType(event.target.value)}
                                >
                                    <option value="text">Text</option>
                                    <option value="news">News</option>
                                    <option value="voice">Voice</option>
                                    <option value="category">Category</option>
                                </select>
                                <label className="community-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={channelReadOnly}
                                        onChange={(event) => setChannelReadOnly(event.target.checked)}
                                    />
                                    Read-only
                                </label>
                            </div>
                            <input
                                className="community-input"
                                value={channelTopic}
                                onChange={(event) => setChannelTopic(event.target.value)}
                                placeholder="Topic / description"
                            />
                            <div className="channel-create-actions">
                                <button
                                    className="community-cta"
                                    onClick={handleCreateChannel}
                                    disabled={!channelName.trim()}
                                >
                                    Create Channel
                                </button>
                                <button
                                    className="community-cta ghost"
                                    onClick={() => setShowChannelForm(false)}
                                >
                                    Cancel
                                </button>
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
                            {canManage && activeChannel && (
                                <>
                                    <button className="chat-action" onClick={handleArchiveChannel}>
                                        {activeChannel.isArchived ? "Unarchive" : "Archive"}
                                    </button>
                                    <button className="chat-action danger" onClick={handleDeleteChannel}>
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </header>

                    {(servers.length === 0 || showServerForm) && (
                        <div className="community-empty">
                            <h2>Create a server</h2>
                            <p>Spin up a community hub for text, news, and voice channels.</p>
                            <label className="community-label" htmlFor="server-name">
                                Server name
                            </label>
                            <input
                                id="server-name"
                                className="community-input"
                                value={createName}
                                onChange={(event) => setCreateName(event.target.value)}
                                placeholder="DnD United"
                            />
                            <label className="community-label" htmlFor="server-description">
                                Description
                            </label>
                            <textarea
                                id="server-description"
                                className="community-textarea"
                                value={createDescription}
                                onChange={(event) => setCreateDescription(event.target.value)}
                                placeholder="Campaign prep, tavern chatter, and announcements."
                            />
                            <label className="community-checkbox">
                                <input
                                    type="checkbox"
                                    checked={createPrivate}
                                    onChange={(event) => setCreatePrivate(event.target.checked)}
                                />
                                Private server
                            </label>
                            <div className="channel-create-actions">
                                <button
                                    className="community-cta"
                                    onClick={handleCreateServer}
                                    disabled={!createName.trim()}
                                >
                                    Create Server
                                </button>
                                {servers.length > 0 && (
                                    <button
                                        className="community-cta ghost"
                                        onClick={() => setShowServerForm(false)}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

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
                                        {isTextChannel(activeChannel.type) && (                                            <div className="reaction-row">
                                                {[":star:", ":sword:", ":fire:"].map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        className={`reaction-pill ${
                                                            message.myReactions?.includes(emoji) ? "is-active" : ""
                                                        }`}
                                                        onClick={() => toggleReaction(message.id, emoji)}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                                {message.reactions?.map((reaction) => (
                                                    <span key={reaction.emoji} className="reaction-count">
                                                        {reaction.emoji} {reaction.count}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
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

                    {canManage && (
                        <div className="server-settings">
                            <h4>Server Settings</h4>
                            <label className="community-label" htmlFor="server-title">
                                Name
                            </label>
                            <input
                                id="server-title"
                                className="community-input"
                                value={serverName}
                                onChange={(event) => setServerName(event.target.value)}
                            />
                            <label className="community-label" htmlFor="server-desc">
                                Description
                            </label>
                            <textarea
                                id="server-desc"
                                className="community-textarea"
                                value={serverDescription}
                                onChange={(event) => setServerDescription(event.target.value)}
                            />
                            <label className="community-checkbox">
                                <input
                                    type="checkbox"
                                    checked={serverPrivate}
                                    onChange={(event) => setServerPrivate(event.target.checked)}
                                />
                                Private server
                            </label>
                            <button className="community-cta" onClick={handleUpdateServer}>
                                Save Changes
                            </button>
                            {canDeleteServer && (
                                <button className="community-cta danger" onClick={handleDeleteServer}>
                                    Delete Server
                                </button>
                            )}
                        </div>
                    )}

                    <div className="member-panel">
                        <h4>Voice Status</h4>
                        <div className="speaker-row">
                            <span className="speaker-dot" />
                            <div>
                                <p>{voiceChannelId ? "You" : "No one speaking"}</p>
                                <span>{voiceChannelId ? "Connected" : "Idle"}</span>
                            </div>
                        </div>
                        {voiceChannelId && (
                            <div className="voice-controls">
                                <button
                                    className={`community-cta ${voiceMuted ? "is-active" : ""}`}
                                    onClick={() => handleVoiceState(!voiceMuted, voiceDeafened)}
                                >
                                    {voiceMuted ? "Unmute" : "Mute"}
                                </button>
                                <button
                                    className={`community-cta ${voiceDeafened ? "is-active" : ""}`}
                                    onClick={() => handleVoiceState(voiceMuted, !voiceDeafened)}
                                >
                                    {voiceDeafened ? "Undeafen" : "Deafen"}
                                </button>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CommunityPage;

