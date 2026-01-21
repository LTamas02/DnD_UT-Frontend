import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { API_BASE, CharacterApi, VttApi, getUser } from "../Api";
import "../assets/styles/Vtt.css";
import "../assets/styles/DmtoolsMaps.css";

const resolveAssetUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${API_BASE}${url}`;
};

export default function VttSession() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const sessionKey = Number(sessionId);
    const token = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");

    const [session, setSession] = useState(null);
    const [role, setRole] = useState("Player");
    const [map, setMap] = useState(null);
    const [tokens, setTokens] = useState([]);
    const [members, setMembers] = useState([]);
    const [chat, setChat] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [rollInput, setRollInput] = useState("d20");
    const [error, setError] = useState("");
    const [connecting, setConnecting] = useState(true);
    const [meId, setMeId] = useState(storedUserId ? Number(storedUserId) : null);
    const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [spacePressed, setSpacePressed] = useState(false);
    const [pingMode, setPingMode] = useState(false);
    const [rulerMode, setRulerMode] = useState(false);
    const [ruler, setRuler] = useState(null);
    const [pings, setPings] = useState([]);
    const [initiativeEntries, setInitiativeEntries] = useState([]);
    const [initiativeActiveId, setInitiativeActiveId] = useState(null);
    const [initiativeRound, setInitiativeRound] = useState(1);
    const [initiativeName, setInitiativeName] = useState("");
    const [initiativeValue, setInitiativeValue] = useState("");
    const [initiativeTokenId, setInitiativeTokenId] = useState("");
    const [characters, setCharacters] = useState([]);
    const [selectedCharacterId, setSelectedCharacterId] = useState("");
    const [tokenName, setTokenName] = useState("");
    const [tokenImageUrl, setTokenImageUrl] = useState("");
    const [mapDraft, setMapDraft] = useState({
        name: "",
        gridSize: 50,
        gridOffsetX: 0,
        gridOffsetY: 0,
        width: 50,
        height: 50
    });

    const connectionRef = useRef(null);
    const boardRef = useRef(null);
    const dragRef = useRef(null);
    const panRef = useRef(null);
    const scrollRef = useRef(null);
    const rulerRef = useRef(null);

    const isDm = role === "DM";
    const supportsPointer = typeof window !== "undefined" && "PointerEvent" in window;

    useEffect(() => {
        if (!token || meId != null) return;
        getUser(token)
            .then((res) => {
                if (res?.data?.id != null) {
                    setMeId(res.data.id);
                    localStorage.setItem("userId", res.data.id);
                }
            })
            .catch(() => {});
    }, [token, meId]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const target = event.target;
            const isTypingTarget =
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable);

            if (event.code === "Space" && !isTypingTarget) {
                setSpacePressed(true);
                event.preventDefault();
            }
            if (event.key === "Escape") {
                setPingMode(false);
                setRulerMode(false);
                setRuler(null);
                rulerRef.current = null;
            }
        };

        const handleKeyUp = (event) => {
            if (event.code === "Space") {
                setSpacePressed(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    useEffect(() => {
        if (!token || !Number.isFinite(sessionKey)) return;
        let cancelled = false;

        const loadState = async () => {
            setError("");
            setPings([]);
            setRuler(null);
            rulerRef.current = null;
            setPingMode(false);
            setRulerMode(false);
            try {
                await VttApi.joinSession(sessionKey);
                const state = await VttApi.getState(sessionKey);
                if (cancelled) return;

                setSession(state.session || null);
                setRole(state.role || "Player");
                setMap(state.map || null);
                setTokens(Array.isArray(state.tokens) ? state.tokens : []);
                setMembers(Array.isArray(state.members) ? state.members : []);
                setChat(Array.isArray(state.chat) ? state.chat : []);
                setInitiativeEntries(
                    Array.isArray(state.initiative?.entries) ? state.initiative.entries : []
                );
                setInitiativeActiveId(state.initiative?.activeEntryId ?? null);
                setInitiativeRound(state.initiative?.round ?? 1);

                if (state.map) {
                    setMapDraft({
                        name: state.map.name || "Main Map",
                        gridSize: state.map.gridSize || 50,
                        gridOffsetX: state.map.gridOffsetX || 0,
                        gridOffsetY: state.map.gridOffsetY || 0,
                        width: state.map.width || 50,
                        height: state.map.height || 50
                    });
                }
            } catch (err) {
                console.error("Failed to load VTT state:", err);
                if (!cancelled) {
                    setError("Failed to load session.");
                }
            }
        };

        loadState();
        return () => {
            cancelled = true;
        };
    }, [sessionKey, token]);

    useEffect(() => {
        if (!token || !Number.isFinite(sessionKey)) return;

        const connection = new HubConnectionBuilder()
            .withUrl(`${API_BASE}/hubs/vtt`, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Error)
            .build();

        connectionRef.current = connection;

        connection.on("chatReceived", (message) => {
            if (!message) return;
            setChat((prev) => [...prev, message]);
        });

        connection.on("tokenCreated", (tokenData) => {
            if (!tokenData) return;
            setTokens((prev) => {
                if (prev.some((t) => t.id === tokenData.id)) return prev;
                return [...prev, tokenData];
            });
        });

        connection.on("tokenUpdated", (tokenData) => {
            if (!tokenData) return;
            setTokens((prev) => {
                const exists = prev.some((t) => t.id === tokenData.id);
                if (!exists) return [...prev, tokenData];
                return prev.map((t) => (t.id === tokenData.id ? { ...t, ...tokenData } : t));
            });
        });

        connection.on("tokenDeleted", (payload) => {
            if (!payload?.id) return;
            setTokens((prev) => prev.filter((t) => t.id !== payload.id));
        });

        connection.on("mapUpdated", (mapData) => {
            if (!mapData) return;
            setMap(mapData);
            setMapDraft((prev) => ({
                name: mapData.name ?? prev.name,
                gridSize: mapData.gridSize ?? prev.gridSize,
                gridOffsetX: mapData.gridOffsetX ?? prev.gridOffsetX,
                gridOffsetY: mapData.gridOffsetY ?? prev.gridOffsetY,
                width: mapData.width ?? prev.width,
                height: mapData.height ?? prev.height
            }));
        });

        connection.on("initiativeUpdated", (payload) => {
            if (!payload) return;
            setInitiativeEntries(Array.isArray(payload.entries) ? payload.entries : []);
            setInitiativeActiveId(payload.activeEntryId ?? null);
            setInitiativeRound(payload.round ?? 1);
        });

        connection.on("ping", (payload) => {
            if (!payload) return;
            const pingId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const newPing = {
                id: pingId,
                userId: payload.userId,
                username: payload.username,
                x: payload.x,
                y: payload.y
            };
            setPings((prev) => [...prev, newPing]);
            setTimeout(() => {
                setPings((prev) => prev.filter((ping) => ping.id !== pingId));
            }, 2500);
        });

        connection
            .start()
            .then(async () => {
                setConnecting(false);
                await connection.invoke("JoinSession", sessionKey);
            })
            .catch((err) => {
                console.error("SignalR connection error:", err);
                setError("Failed to connect to VTT.");
                setConnecting(false);
            });

        return () => {
            connection.stop().catch(() => {});
            connectionRef.current = null;
        };
    }, [sessionKey, token]);

    useEffect(() => {
        let cancelled = false;
        const loadCharacters = async () => {
            try {
                const data = await CharacterApi.getAll();
                if (cancelled) return;
                setCharacters(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to load characters:", err);
            }
        };

        loadCharacters();
        return () => {
            cancelled = true;
        };
    }, []);

    const displayGridSize = useMemo(() => {
        const base = map?.gridSize || 50;
        return base * zoom;
    }, [map, zoom]);

    const mapWidth = useMemo(() => {
        const width = map?.width || 50;
        return width * displayGridSize;
    }, [map, displayGridSize]);

    const mapHeight = useMemo(() => {
        const height = map?.height || 50;
        return height * displayGridSize;
    }, [map, displayGridSize]);

    const minZoom = 0.5;
    const maxZoom = 2.5;
    const zoomLabel = `${Math.round(zoom * 100)}%`;

    const clampZoom = (value) => Math.min(maxZoom, Math.max(minZoom, value));

    const activeInitiativeEntry = useMemo(() => {
        if (!initiativeActiveId) return null;
        return initiativeEntries.find((entry) => entry.id === initiativeActiveId) || null;
    }, [initiativeActiveId, initiativeEntries]);

    const activeInitiativeTokenId = activeInitiativeEntry?.tokenId ?? null;

    const getGridPointFromEvent = useCallback((event) => {
        if (!boardRef.current) return { x: 0, y: 0 };
        const rect = boardRef.current.getBoundingClientRect();
        const rawX = event.clientX - rect.left;
        const rawY = event.clientY - rect.top;
        const gridX = Math.max(0, Math.round(rawX / displayGridSize));
        const gridY = Math.max(0, Math.round(rawY / displayGridSize));
        return { x: gridX, y: gridY };
    }, [displayGridSize]);

    useEffect(() => {
        const onMove = (event) => {
            if (panRef.current && scrollRef.current) {
                if (supportsPointer && event.pointerId !== panRef.current.pointerId) return;
                const { startX, startY, scrollLeft, scrollTop } = panRef.current;
                const dx = event.clientX - startX;
                const dy = event.clientY - startY;
                scrollRef.current.scrollLeft = scrollLeft - dx;
                scrollRef.current.scrollTop = scrollTop - dy;
                return;
            }

            if (rulerRef.current?.active && boardRef.current) {
                if (supportsPointer && event.pointerId !== rulerRef.current.pointerId) return;
                const point = getGridPointFromEvent(event);
                const nextRuler = { ...rulerRef.current, end: point };
                rulerRef.current = nextRuler;
                setRuler(nextRuler);
                return;
            }

            if (!dragRef.current || !boardRef.current || !map) return;
            if (supportsPointer && event.pointerId !== dragRef.current.pointerId) return;
            const { tokenId, offsetX, offsetY } = dragRef.current;
            const rect = boardRef.current.getBoundingClientRect();
            const gridSize = displayGridSize || 50;

            const rawX = event.clientX - rect.left - offsetX;
            const rawY = event.clientY - rect.top - offsetY;

            const snappedX = Math.max(0, Math.round(rawX / gridSize));
            const snappedY = Math.max(0, Math.round(rawY / gridSize));

            dragRef.current.lastX = snappedX;
            dragRef.current.lastY = snappedY;

            setTokens((prev) =>
                prev.map((t) =>
                    t.id === tokenId ? { ...t, x: snappedX, y: snappedY } : t
                )
            );
        };

        const onUp = (event) => {
            if (panRef.current) {
                if (!supportsPointer || event.pointerId === panRef.current.pointerId) {
                    panRef.current = null;
                    setIsPanning(false);
                } else {
                    return;
                }
            }

            if (!dragRef.current) return;
            if (supportsPointer && event.pointerId !== dragRef.current.pointerId) return;
            const { tokenId, lastX, lastY } = dragRef.current;
            dragRef.current = null;

            if (!connectionRef.current) return;
            connectionRef.current
                .invoke("UpdateToken", sessionKey, {
                    tokenId,
                    x: lastX,
                    y: lastY
                })
                .catch((err) => console.error("Failed to update token:", err));
        };

        const moveEvent = supportsPointer ? "pointermove" : "mousemove";
        const upEvent = supportsPointer ? "pointerup" : "mouseup";
        const cancelEvent = supportsPointer ? "pointercancel" : null;

        window.addEventListener(moveEvent, onMove);
        window.addEventListener(upEvent, onUp);
        if (cancelEvent) {
            window.addEventListener(cancelEvent, onUp);
        }
        return () => {
            window.removeEventListener(moveEvent, onMove);
            window.removeEventListener(upEvent, onUp);
            if (cancelEvent) {
                window.removeEventListener(cancelEvent, onUp);
            }
        };
    }, [map, sessionKey, displayGridSize, getGridPointFromEvent, supportsPointer]);

    const handleSendChat = async () => {
        if (!chatInput.trim() || !connectionRef.current) return;
        try {
            await connectionRef.current.invoke("SendChat", sessionKey, chatInput.trim());
            setChatInput("");
        } catch (err) {
            console.error("Failed to send chat:", err);
        }
    };

    const handleRollDice = async () => {
        if (!rollInput.trim() || !connectionRef.current) return;
        try {
            await connectionRef.current.invoke("RollDice", sessionKey, rollInput.trim());
            setRollInput("");
        } catch (err) {
            console.error("Failed to roll dice:", err);
        }
    };

    const handleInitiativeTokenChange = (event) => {
        const tokenId = event.target.value;
        setInitiativeTokenId(tokenId);
        if (!tokenId) return;
        const token = tokens.find((entry) => String(entry.id) === String(tokenId));
        if (token?.name) {
            setInitiativeName(token.name);
        }
    };

    const handleAddInitiative = async () => {
        if (!connectionRef.current || !isDm) return;
        const value = Number.parseInt(initiativeValue, 10);
        if (!Number.isFinite(value)) return;
        try {
            await connectionRef.current.invoke("AddInitiativeEntry", sessionKey, {
                name: initiativeName.trim(),
                value,
                tokenId: initiativeTokenId ? Number(initiativeTokenId) : null
            });
            setInitiativeName("");
            setInitiativeValue("");
            setInitiativeTokenId("");
        } catch (err) {
            console.error("Failed to add initiative entry:", err);
        }
    };

    const handleRemoveInitiativeEntry = async (entryId) => {
        if (!connectionRef.current || !isDm) return;
        try {
            await connectionRef.current.invoke("RemoveInitiativeEntry", sessionKey, entryId);
        } catch (err) {
            console.error("Failed to remove initiative entry:", err);
        }
    };

    const handleSetInitiativeActive = async (entryId) => {
        if (!connectionRef.current || !isDm) return;
        try {
            const nextId = entryId === initiativeActiveId ? null : entryId;
            await connectionRef.current.invoke("SetInitiativeActive", sessionKey, nextId);
        } catch (err) {
            console.error("Failed to set active initiative:", err);
        }
    };

    const handleStepInitiative = async (direction) => {
        if (!connectionRef.current || !isDm) return;
        try {
            await connectionRef.current.invoke("StepInitiative", sessionKey, direction);
        } catch (err) {
            console.error("Failed to step initiative:", err);
        }
    };

    const handleResetInitiative = async () => {
        if (!connectionRef.current || !isDm) return;
        try {
            await connectionRef.current.invoke("ResetInitiative", sessionKey);
        } catch (err) {
            console.error("Failed to reset initiative:", err);
        }
    };

    const canEditToken = (token) => {
        if (isDm) return true;
        if (token.isLocked) return false;
        return token.ownerUserId === meId;
    };

    const handleTokenMouseDown = (event, token) => {
        if (supportsPointer && event.isPrimary === false) return;
        if (!canEditToken(token)) return;
        if (spacePressed) return;
        if (!boardRef.current) return;

        event.preventDefault();
        event.stopPropagation();
        if (supportsPointer && event.currentTarget?.setPointerCapture) {
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        const rect = boardRef.current.getBoundingClientRect();
        const gridSize = displayGridSize || 50;
        const tokenLeft = token.x * gridSize;
        const tokenTop = token.y * gridSize;

        dragRef.current = {
            tokenId: token.id,
            offsetX: event.clientX - rect.left - tokenLeft,
            offsetY: event.clientY - rect.top - tokenTop,
            lastX: token.x,
            lastY: token.y,
            pointerId: supportsPointer ? event.pointerId : null
        };
    };

    const handleBoardMouseDown = (event) => {
        if (!scrollRef.current) return;
        if (supportsPointer && event.isPrimary === false) return;

        const isTouchLike = supportsPointer && event.pointerType && event.pointerType !== "mouse";
        const shouldPan =
            event.button === 1 || spacePressed || (isTouchLike && !pingMode && !rulerMode);

        if (shouldPan) {
            panRef.current = {
                startX: event.clientX,
                startY: event.clientY,
                scrollLeft: scrollRef.current.scrollLeft,
                scrollTop: scrollRef.current.scrollTop,
                pointerId: supportsPointer ? event.pointerId : null
            };
            setIsPanning(true);
            event.preventDefault();
            return;
        }

        if (event.button !== 0) return;

        if (pingMode) {
            const point = getGridPointFromEvent(event);
            if (connectionRef.current) {
                connectionRef.current
                    .invoke("SendPing", sessionKey, point)
                    .catch((err) => console.error("Failed to send ping:", err));
            }
            const pingId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            const localPing = {
                id: pingId,
                userId: meId,
                username: "You",
                x: point.x,
                y: point.y
            };
            setPings((prev) => [...prev, localPing]);
            setTimeout(() => {
                setPings((prev) => prev.filter((ping) => ping.id !== pingId));
            }, 1500);
            event.preventDefault();
            return;
        }

        if (rulerMode) {
            const point = getGridPointFromEvent(event);
            if (rulerRef.current?.active) {
                const nextRuler = { ...rulerRef.current, end: point, active: false };
                rulerRef.current = nextRuler;
                setRuler(nextRuler);
            } else {
                const nextRuler = {
                    start: point,
                    end: point,
                    active: true,
                    pointerId: supportsPointer ? event.pointerId : null
                };
                rulerRef.current = nextRuler;
                setRuler(nextRuler);
            }
            event.preventDefault();
            return;
        }
    };

    const handleBoardWheel = (event) => {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        const direction = event.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev) => clampZoom(Number((prev + direction).toFixed(2))));
    };

    const getSpawnPoint = () => {
        const width = map?.width || 50;
        const height = map?.height || 50;
        const offset = tokens.length % 6;
        return {
            x: Math.max(0, Math.floor(width / 2) + offset),
            y: Math.max(0, Math.floor(height / 2) + offset)
        };
    };

    const handleSpawnCharacterToken = async () => {
        if (!connectionRef.current || !selectedCharacterId) return;
        const character = characters.find(
            (c) => String(c.id) === String(selectedCharacterId)
        );
        if (!character) return;

        const spawn = getSpawnPoint();

        try {
            await connectionRef.current.invoke("CreateToken", sessionKey, {
                name: character.characterName || "Character",
                characterId: character.id,
                ownerUserId: meId,
                imageUrl: character.portraitDataUrl || null,
                x: spawn.x,
                y: spawn.y,
                width: 1,
                height: 1
            });
        } catch (err) {
            console.error("Failed to create token:", err);
        }
    };

    const handleCreateToken = async () => {
        if (!connectionRef.current || !tokenName.trim()) return;
        const spawn = getSpawnPoint();
        try {
            await connectionRef.current.invoke("CreateToken", sessionKey, {
                name: tokenName.trim(),
                imageUrl: tokenImageUrl || null,
                x: spawn.x,
                y: spawn.y,
                width: 1,
                height: 1
            });
            setTokenName("");
        } catch (err) {
            console.error("Failed to create token:", err);
        }
    };

    const handleMapApply = async () => {
        if (!connectionRef.current || !isDm) return;
        try {
            await connectionRef.current.invoke("UpdateMap", sessionKey, mapDraft);
        } catch (err) {
            console.error("Failed to update map:", err);
        }
    };

    const handleMapUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            await VttApi.uploadMapImage(sessionKey, file);
        } catch (err) {
            console.error("Failed to upload map image:", err);
        } finally {
            event.target.value = "";
        }
    };

    const handleAssetUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const data = await VttApi.uploadAsset(sessionKey, file, "token");
            if (data?.url) {
                setTokenImageUrl(data.url);
            }
        } catch (err) {
            console.error("Failed to upload token image:", err);
        } finally {
            event.target.value = "";
        }
    };

    if (!Number.isFinite(sessionKey)) {
        return (
            <div className="page-comp vtt-page">
                <div className="vtt-error">Invalid session ID.</div>
            </div>
        );
    }

    return (
        <div className="page-comp vtt-page">
            <div className="vtt-shell">
                <header className="vtt-header vtt-hero">
                    <div>
                        <span className="vtt-hero-kicker">Entering the War Room</span>
                        <h1>{session?.name || "Virtual Tabletop"}</h1>
                        <p>
                            Role: {role} {connecting ? "(connecting...)" : ""}
                        </p>
                    </div>
                    <div className="vtt-header-actions">
                        <div className="vtt-tool-toggles">
                            <button
                                className={`dmtools-action vtt-tool-button ${
                                    pingMode ? "is-active" : ""
                                }`}
                                onClick={() => {
                                    setPingMode((prev) => !prev);
                                    setRulerMode(false);
                                    setRuler(null);
                                    rulerRef.current = null;
                                }}
                            >
                                Ping
                            </button>
                            <button
                                className={`dmtools-action vtt-tool-button ${
                                    rulerMode ? "is-active" : ""
                                }`}
                                onClick={() => {
                                    setRulerMode((prev) => !prev);
                                    setPingMode(false);
                                    setRuler(null);
                                    rulerRef.current = null;
                                }}
                            >
                                Ruler
                            </button>
                        </div>
                        <div className="vtt-zoom-controls">
                            <button
                                className="dmtools-action"
                                onClick={() => setZoom((prev) => clampZoom(prev - 0.1))}
                            >
                                -
                            </button>
                            <span className="vtt-zoom-label">{zoomLabel}</span>
                            <button
                                className="dmtools-action"
                                onClick={() => setZoom((prev) => clampZoom(prev + 0.1))}
                            >
                                +
                            </button>
                            <button className="dmtools-action" onClick={() => setZoom(1)}>
                                Reset
                            </button>
                        </div>
                        <button
                            className="dmtools-action"
                            onClick={() => setToolbarCollapsed((prev) => !prev)}
                        >
                            {toolbarCollapsed ? "Show Toolbar" : "Hide Toolbar"}
                        </button>
                        <button
                            className="dmtools-action vtt-glow-button"
                            onClick={() => navigate("/vtt")}
                        >
                            Back to Lobby
                        </button>
                    </div>
                </header>

                {error && <div className="vtt-error">{error}</div>}

                <div className={`vtt-layout ${toolbarCollapsed ? "toolbar-collapsed" : ""}`}>
                    <div className="vtt-board-wrap">
                        <div
                            className={`vtt-board-scroll ${isPanning ? "is-panning" : ""}`}
                            ref={scrollRef}
                            onWheel={handleBoardWheel}
                        >
                            <div
                                className={`vtt-board ${
                                    spacePressed ? "is-pan" : ""
                                } ${pingMode ? "is-ping" : ""} ${rulerMode ? "is-ruler" : ""}`}
                                ref={boardRef}
                                onPointerDown={handleBoardMouseDown}
                                style={{
                                    width: mapWidth,
                                    height: mapHeight,
                                    backgroundImage: map?.imageUrl
                                        ? `url(${resolveAssetUrl(map.imageUrl)})`
                                        : "none"
                                }}
                            >
                                <div
                                    className="vtt-grid"
                                    style={{
                                        backgroundSize: `${displayGridSize}px ${displayGridSize}px`,
                                        backgroundPosition: `${(map?.gridOffsetX || 0) * zoom}px ${
                                            (map?.gridOffsetY || 0) * zoom
                                        }px`
                                    }}
                                />
                                {ruler?.start && ruler?.end && (
                                    <svg className="vtt-ruler">
                                        <line
                                            x1={ruler.start.x * displayGridSize}
                                            y1={ruler.start.y * displayGridSize}
                                            x2={ruler.end.x * displayGridSize}
                                            y2={ruler.end.y * displayGridSize}
                                        />
                                        <text
                                            x={(ruler.start.x + ruler.end.x) / 2 * displayGridSize}
                                            y={(ruler.start.y + ruler.end.y) / 2 * displayGridSize - 6}
                                            textAnchor="middle"
                                        >
                                            {(Math.hypot(
                                                ruler.end.x - ruler.start.x,
                                                ruler.end.y - ruler.start.y
                                            ) * 5).toFixed(1)}
                                        </text>
                                    </svg>
                                )}
                                {pings.map((ping) => (
                                    <div
                                        key={ping.id}
                                        className="vtt-ping"
                                        style={{
                                            left: ping.x * displayGridSize,
                                            top: ping.y * displayGridSize
                                        }}
                                        title={ping.username || "Ping"}
                                    />
                                ))}
                                {tokens.map((tokenItem) => {
                                    const gridSize = displayGridSize || 50;
                                    const isInitiativeActive =
                                        activeInitiativeTokenId &&
                                        tokenItem.id === activeInitiativeTokenId;
                                    const style = {
                                        width: (tokenItem.width || 1) * gridSize,
                                        height: (tokenItem.height || 1) * gridSize,
                                        left: (tokenItem.x || 0) * gridSize,
                                        top: (tokenItem.y || 0) * gridSize,
                                        transform: `rotate(${tokenItem.rotation || 0}deg)`,
                                        backgroundImage: tokenItem.imageUrl
                                            ? `url(${resolveAssetUrl(tokenItem.imageUrl)})`
                                            : "none"
                                    };
                                    const isLocked = tokenItem.isLocked && !isDm;
                                    return (
                                        <div
                                            key={tokenItem.id}
                                            className={`vtt-token ${
                                                tokenItem.imageUrl ? "has-image" : ""
                                            } ${isLocked ? "is-locked" : ""} ${
                                                isInitiativeActive ? "is-initiative-active" : ""
                                            }`}
                                            style={style}
                                            onPointerDown={(event) =>
                                                handleTokenMouseDown(event, tokenItem)
                                            }
                                            title={tokenItem.name}
                                        >
                                            {!tokenItem.imageUrl && (
                                                <span className="vtt-token-label">
                                                    {tokenItem.name || "Token"}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <aside className="vtt-sidebar">
                        <div className="vtt-panel">
                            <h2>Players</h2>
                            <div className="vtt-members">
                                {members.map((member) => (
                                    <div key={member.userId} className="vtt-member">
                                        <span>{member.username}</span>
                                        <span className="vtt-role">{member.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="vtt-panel">
                            <h2>Chat</h2>
                            <div className="vtt-chat-list">
                                {chat.map((message, index) => (
                                    <div key={`${message.id || index}`} className="vtt-chat-message">
                                        <strong>{message.username || "User"}:</strong>{" "}
                                        <span>{message.content}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="vtt-chat-input">
                                <input
                                    className="dmtools-input"
                                    value={chatInput}
                                    onChange={(event) => setChatInput(event.target.value)}
                                    placeholder="Say something..."
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") handleSendChat();
                                    }}
                                />
                                <button className="dmtools-action" onClick={handleSendChat}>
                                    Send
                                </button>
                            </div>
                        </div>

                        <div className="vtt-panel">
                            <h2>Dice</h2>
                            <div className="vtt-chat-input">
                                <input
                                    className="dmtools-input"
                                    value={rollInput}
                                    onChange={(event) => setRollInput(event.target.value)}
                                    placeholder="2d6+3"
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") handleRollDice();
                                    }}
                                />
                                <button className="dmtools-action" onClick={handleRollDice}>
                                    Roll
                                </button>
                            </div>
                        </div>

                        <div className="vtt-panel">
                            <h2>Initiative</h2>
                            <div className="vtt-initiative-header">
                                <span className="vtt-initiative-round">
                                    Round {initiativeRound}
                                </span>
                                {isDm && (
                                    <div className="vtt-initiative-actions">
                                        <button
                                            className="dmtools-action"
                                            onClick={() => handleStepInitiative(-1)}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            className="dmtools-action"
                                            onClick={() => handleStepInitiative(1)}
                                        >
                                            Next
                                        </button>
                                        <button
                                            className="dmtools-action dmtools-danger"
                                            onClick={handleResetInitiative}
                                        >
                                            Reset
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="vtt-initiative-list">
                                {initiativeEntries.length === 0 ? (
                                    <div className="vtt-empty">No initiative yet.</div>
                                ) : (
                                    initiativeEntries.map((entry) => {
                                        const isActive = entry.id === initiativeActiveId;
                                        return (
                                            <div
                                                key={entry.id}
                                                className={`vtt-initiative-entry ${
                                                    isActive ? "is-active" : ""
                                                }`}
                                                onClick={
                                                    isDm
                                                        ? () => handleSetInitiativeActive(entry.id)
                                                        : undefined
                                                }
                                            >
                                                <div className="vtt-initiative-main">
                                                    <span className="vtt-initiative-name">
                                                        {entry.name || "Entry"}
                                                    </span>
                                                    <span className="vtt-initiative-value">
                                                        {entry.value}
                                                    </span>
                                                </div>
                                                {isDm && (
                                                    <button
                                                        className="dmtools-action vtt-initiative-remove"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleRemoveInitiativeEntry(entry.id);
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            {isDm && (
                                <div className="vtt-initiative-form">
                                    <label className="dmtools-label">Token (optional)</label>
                                    <select
                                        className="dmtools-input"
                                        value={initiativeTokenId}
                                        onChange={handleInitiativeTokenChange}
                                    >
                                        <option value="">No token</option>
                                        {tokens.map((tokenItem) => (
                                            <option key={tokenItem.id} value={tokenItem.id}>
                                                {tokenItem.name || `Token ${tokenItem.id}`}
                                            </option>
                                        ))}
                                    </select>
                                    <label className="dmtools-label">Name</label>
                                    <input
                                        className="dmtools-input"
                                        value={initiativeName}
                                        onChange={(event) =>
                                            setInitiativeName(event.target.value)
                                        }
                                        placeholder="Goblin Raider"
                                    />
                                    <label className="dmtools-label">Initiative</label>
                                    <input
                                        className="dmtools-input"
                                        type="number"
                                        value={initiativeValue}
                                        onChange={(event) =>
                                            setInitiativeValue(event.target.value)
                                        }
                                        placeholder="14"
                                    />
                                    <button
                                        className="dmtools-action"
                                        onClick={handleAddInitiative}
                                    >
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="vtt-panel">
                            <h2>My Characters</h2>
                            <select
                                className="dmtools-input"
                                value={selectedCharacterId}
                                onChange={(event) => setSelectedCharacterId(event.target.value)}
                            >
                                <option value="">Select a character</option>
                                {characters.map((character) => (
                                    <option key={character.id} value={character.id}>
                                        {character.characterName || `Character ${character.id}`}
                                    </option>
                                ))}
                            </select>
                            <button className="dmtools-action" onClick={handleSpawnCharacterToken}>
                                Spawn Token
                            </button>
                        </div>

                        <div className="vtt-panel">
                            <h2>Custom Token</h2>
                            <label className="dmtools-label">Token name</label>
                            <input
                                className="dmtools-input"
                                value={tokenName}
                                onChange={(event) => setTokenName(event.target.value)}
                                placeholder="Goblin Scout"
                            />
                            <label className="dmtools-label">Token image</label>
                            <input type="file" onChange={handleAssetUpload} />
                            {tokenImageUrl && (
                                <div className="vtt-preview">
                                    <img src={resolveAssetUrl(tokenImageUrl)} alt="Token preview" />
                                </div>
                            )}
                            <button className="dmtools-action" onClick={handleCreateToken}>
                                Create Token
                            </button>
                        </div>

                        {isDm && (
                            <div className="vtt-panel">
                                <h2>Map Settings</h2>
                                <label className="dmtools-label">Map name</label>
                                <input
                                    className="dmtools-input"
                                    value={mapDraft.name}
                                    onChange={(event) =>
                                        setMapDraft((prev) => ({
                                            ...prev,
                                            name: event.target.value
                                        }))
                                    }
                                />
                                <label className="dmtools-label">Grid size (px)</label>
                                <input
                                    className="dmtools-input"
                                    type="number"
                                    value={mapDraft.gridSize}
                                    onChange={(event) =>
                                        setMapDraft((prev) => ({
                                            ...prev,
                                            gridSize: Number(event.target.value)
                                        }))
                                    }
                                />
                                <label className="dmtools-label">Map width (cells)</label>
                                <input
                                    className="dmtools-input"
                                    type="number"
                                    value={mapDraft.width}
                                    onChange={(event) =>
                                        setMapDraft((prev) => ({
                                            ...prev,
                                            width: Number(event.target.value)
                                        }))
                                    }
                                />
                                <label className="dmtools-label">Map height (cells)</label>
                                <input
                                    className="dmtools-input"
                                    type="number"
                                    value={mapDraft.height}
                                    onChange={(event) =>
                                        setMapDraft((prev) => ({
                                            ...prev,
                                            height: Number(event.target.value)
                                        }))
                                    }
                                />
                                <div className="vtt-row">
                                    <div>
                                        <label className="dmtools-label">Grid offset X</label>
                                        <input
                                            className="dmtools-input"
                                            type="number"
                                            value={mapDraft.gridOffsetX}
                                            onChange={(event) =>
                                                setMapDraft((prev) => ({
                                                    ...prev,
                                                    gridOffsetX: Number(event.target.value)
                                                }))
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="dmtools-label">Grid offset Y</label>
                                        <input
                                            className="dmtools-input"
                                            type="number"
                                            value={mapDraft.gridOffsetY}
                                            onChange={(event) =>
                                                setMapDraft((prev) => ({
                                                    ...prev,
                                                    gridOffsetY: Number(event.target.value)
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="vtt-row">
                                    <button className="dmtools-action" onClick={handleMapApply}>
                                        Apply Settings
                                    </button>
                                    <label className="dmtools-action vtt-file-button">
                                        Upload Map
                                        <input type="file" onChange={handleMapUpload} />
                                    </label>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}
