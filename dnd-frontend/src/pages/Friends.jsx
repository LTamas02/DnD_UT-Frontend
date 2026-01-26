// src/pages/Friends.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    getUser,
    getFriends,
    deleteFriend,
    searchFriends,
    addFriend,
    getFriendRequests,
    respondFriendRequest,
    blockFriend,
    unblockFriend,
    getMutualFriends,
    inviteMultipleFriends
} from "../assets/api/dndtoolapi";
import Footer from "../components/Footer";
import DirectMessagePopup from "../components/DirectMessagePopup";

import "bootstrap/dist/css/bootstrap.css";
import "../assets/styles/Friends.css";

const Friends = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [friends, setFriends] = useState([]);
    const [meId, setMeId] = useState(null);
    const [activeChat, setActiveChat] = useState(null);
    const [friendRequests, setFriendRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);

    const [friendSearchModal, setFriendSearchModal] = useState(false);
    const [friendRequestsModal, setFriendRequestsModal] = useState(false);
    const [mutualFriendsModal, setMutualFriendsModal] = useState(false);

    const [mutualFriends, setMutualFriends] = useState([]);
    const [inviteList, setInviteList] = useState([]);

    useEffect(() => {
        if (!token) {
            navigate("/logreg");
            return;
        }

        getUser(token).then(res => setMeId(res.data?.id ?? null));
        getFriends(token).then(res => setFriends(res.data || []));
        getFriendRequests(token).then(res => setFriendRequests(res.data || []));
    }, [token, navigate]);

    const refreshFriends = () => {
        getFriends(token).then(res => setFriends(res.data || []));
    };

    const removeFriend = (friendId) => {
        if (!window.confirm("Are you sure you want to remove this friend?")) return;
        deleteFriend(token, friendId).then(refreshFriends);
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        setLoadingSearch(true);

        searchFriends(token, searchQuery)
            .then(res => {
                setSearchResults(res.data || []);
                setLoadingSearch(false);
            })
            .catch(() => setLoadingSearch(false));
    };

    const sendFriendRequest = (username) => {
        addFriend(token, username).then(() => {
            alert(`Friend request sent to ${username}`);
        });
    };

    const handleFriendRequest = (requestId, action) => {
        respondFriendRequest(token, requestId, action).then(() => {
            setFriendRequests(friendRequests.filter(r => r.id !== requestId));
        });
    };

    const handleBlockFriend = (friendId) => {
        blockFriend(token, friendId).then(refreshFriends);
    };

    const handleUnblockFriend = (friendId) => {
        unblockFriend(token, friendId).then(refreshFriends);
    };

    const showMutualFriends = (friendId) => {
        getMutualFriends(token, friendId).then(res => {
            setMutualFriends(res.data || []);
            setMutualFriendsModal(true);
        });
    };

    const handleInviteMultiple = () => {
        if (inviteList.length === 0) return alert("Select friends to invite.");
        inviteMultipleFriends(token, inviteList).then(() => {
            alert("Invitations sent.");
            setInviteList([]);
        });
    };

    const toggleInviteFriend = (id) => {
        setInviteList(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    return (
        <div id="friends-page">
            <div className="container mt-4">
                <h2 className="mb-3">Friends</h2>

                <div className="mb-3 d-flex gap-2">
                    <button className="btn btn-primary" onClick={() => setFriendSearchModal(true)}>Add Friend</button>
                    <button className="btn btn-outline-secondary" onClick={() => setFriendRequestsModal(true)}>
                        Requests {friendRequests.length > 0 && <span className="badge bg-danger">{friendRequests.length}</span>}
                    </button>
                    <button className="btn btn-success" onClick={handleInviteMultiple}>Invite Selected</button>
                </div>

                {friends.length === 0 ? (
                    <p>You have no friends yet.</p>
                ) : (
                    <ul className="list-unstyled friends-list">
                        {friends.map(friend => (
                            <li key={friend.id} className="friend d-flex align-items-center mb-2">
                                <input
                                    type="checkbox"
                                    checked={inviteList.includes(friend.id)}
                                    onChange={() => toggleInviteFriend(friend.id)}
                                    className="me-2"
                                />
                                <img
                                    src={friend.profilePictureUrl || friend.profile_picture || "/defaults/profile_picture.jpg"}
                                    alt="Friend"
                                    className="friend-pic rounded-circle"
                                />
                                <span className="ms-2 flex-grow-1">{friend.username}</span>

                                <button className="btn btn-info btn-sm me-1" onClick={() => showMutualFriends(friend.id)}>Mutual</button>
                                <button className="btn btn-danger btn-sm me-1" onClick={() => removeFriend(friend.id)}>Remove</button>
                                {friend.blocked ? (
                                    <button className="btn btn-secondary btn-sm me-1" onClick={() => handleUnblockFriend(friend.id)}>Unblock</button>
                                ) : (
                                    <button className="btn btn-warning btn-sm me-1" onClick={() => handleBlockFriend(friend.id)}>Block</button>
                                )}
                                <button className="btn btn-primary btn-sm" onClick={() => setActiveChat(friend)}>Chat</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Footer />

            {activeChat && (
                <DirectMessagePopup
                    token={token}
                    meId={meId}
                    friend={activeChat}
                    onClose={() => setActiveChat(null)}
                />
            )}

            {friendSearchModal && (
                <div className="modal d-block">
                    <div className="modal-content">
                        <span className="close-btn" onClick={() => setFriendSearchModal(false)}>X</span>
                        <h2>Search for Friends</h2>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter username"
                            className="form-control mb-2"
                        />
                        <button className="btn btn-primary mb-3" onClick={handleSearch}>Search</button>
                        {loadingSearch && <p>Searching...</p>}
                        <ul className="list-unstyled">
                            {searchResults.map(user => (
                                <li key={user.id} className="d-flex align-items-center mb-2">
                                    <span className="flex-grow-1">{user.username}</span>
                                    <button className="btn btn-success btn-sm" onClick={() => sendFriendRequest(user.username)}>Add</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {friendRequestsModal && (
                <div className="modal d-block">
                    <div className="modal-content">
                        <span className="close-btn" onClick={() => setFriendRequestsModal(false)}>X</span>
                        <h2>Friend Requests</h2>
                        <ul className="list-unstyled">
                            {friendRequests.map(req => (
                                <li key={req.id} className="d-flex align-items-center mb-2">
                                    <img src={req.requesterProfilePicture || "/defaults/profile_picture.jpg"} alt="Sender" className="friend-request-pic" />
                                    <span className="flex-grow-1 ms-2">{req.requesterUsername}</span>
                                    <button className="btn btn-success btn-sm me-1" onClick={() => handleFriendRequest(req.id, "accept")}>Accept</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleFriendRequest(req.id, "deny")}>Deny</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {mutualFriendsModal && (
                <div className="modal d-block">
                    <div className="modal-content">
                        <span className="close-btn" onClick={() => setMutualFriendsModal(false)}>X</span>
                        <h2>Mutual Friends</h2>
                        <ul>
                            {mutualFriends.length === 0 ? <p>No mutual friends.</p> : mutualFriends.map(f => <li key={f.id}>{f.username}</li>)}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Friends;

