import { TinderCardContainer } from '../components/TinderCard';
import { useEffect, useState, useRef } from 'react';
// Removed unused ChatContainer import
import { useCookies } from 'react-cookie';
import axios from 'axios';
import PropTypes from 'prop-types';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [genderedUsers, setGenderedUsers] = useState([]);
    // Removed unused lastDirection state
    const [cookies, , removeCookie] = useCookies(['user']); // Removed unused setCookies
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('swipe'); // 'swipe', 'matches', 'chat'
    const [matchAnimation, setMatchAnimation] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editedProfile, setEditedProfile] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const swipeRef = useRef([]);
    const [currentMatch, setCurrentMatch] = useState(null);

    const userId = cookies?.UserId;

    const getUser = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('http://localhost:8000/user', {
                params: { userId },
            });
            setUser(response.data);
            setEditedProfile(response.data);
        } catch (error) {
            console.log('Error fetching user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getGenderedUsers = async () => {
        if (!user?.gender_interest) return;
        try {
            setIsLoading(true);
            const response = await axios.get('http://localhost:8000/gendered-users', {
                params: { gender: user.gender_interest },
            });
            setGenderedUsers(response.data);
        } catch (error) {
            console.log('Error fetching gendered users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getChatMessages = async (matchId) => {
        try {
            setIsLoading(true);
            const response = await axios.get('http://localhost:8000/messages', {
                params: { userId, matchId },
            });
            setChatMessages(response.data);
        } catch (error) {
            console.log('Error fetching messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            getUser();
        }
    }, [userId]); // Added getUser to dependency array

    useEffect(() => {
        if (user) {
            getGenderedUsers();
        }
    }, [user]); // Added getGenderedUsers to dependency array

    const updateMatches = async (matchedUserId) => {
        try {
            setIsLoading(true);
            await axios.put('http://localhost:8000/addmatch', {
                userId,
                matchedUserId,
            });
            setMatchAnimation(true);
            setTimeout(() => {
                setMatchAnimation(false);
                getUser();
            }, 2000);
        } catch (error) {
            console.log('Error updating matches:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const swiped = (direction, swipedUserId, index) => {
        if (direction === 'right') {
            updateMatches(swipedUserId);
        }
        // No need to set lastDirection since it's not used
        setCurrentIndex(index + 1);
    };

    const outOfFrame = (name) => {
        console.log(`${name} left the screen!`);
    };

    const swipeLeft = () => {
        if (!filteredGenderedUsers.length || currentIndex >= filteredGenderedUsers.length) return;
        if (swipeRef.current[currentIndex]) {
            swipeRef.current[currentIndex].swipe('left');
        }
    };

    const swipeRight = () => {
        if (!filteredGenderedUsers.length || currentIndex >= filteredGenderedUsers.length) return;
        if (swipeRef.current[currentIndex]) {
            swipeRef.current[currentIndex].swipe('right');
        }
    };
    
    const handleLogout = () => {
        removeCookie('UserId', cookies.UserId);
        removeCookie('AuthToken', cookies.AuthToken);
        window.location.reload();
    };
    
    const handleHomeClick = () => {
        setActiveTab('swipe');
    };
    
    const toggleEditProfile = () => {
        setIsEditingProfile(!isEditingProfile);
    };
    
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setEditedProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const saveProfile = async () => {
        try {
            setIsLoading(true);
            await axios.put('http://localhost:8000/user', {
                userId,
                ...editedProfile
            });
            setUser(editedProfile);
            setIsEditingProfile(false);
        } catch (error) {
            console.log('Error updating profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMessageSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        try {
            setIsLoading(true);
            const response = await axios.post('http://localhost:8000/message', {
                from_userId: userId,
                to_userId: currentMatch?.user_id || user.matches[0]?.user_id,
                message: newMessage
            });
            setChatMessages([...chatMessages, response.data]);
            setNewMessage('');
        } catch (error) {
            console.log('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const matchedUserIds = user?.matches?.map((match) => match.user_id) || [];
    const filteredGenderedUsers = genderedUsers.filter(
        (genderedUser) =>
            !matchedUserIds.includes(genderedUser.user_id) &&
            genderedUser.user_id !== userId
    );

    return (
        <>
            {user && (
                <div className="app-container">
                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="loading-overlay">
                            <div className="loading-spinner"></div>
                        </div>
                    )}

                    {/* App Header */}
                    <div className="app-header">
                        <div className="app-logo">
                            <img 
                                src={user.url || "https://via.placeholder.com/40"}
                                alt="Profile" 
                                className="profile-thumbnail"
                                onClick={() => setActiveTab('profile')}
                                aria-label="View profile"
                            />
                        </div>
                        <div className="app-name">Crushin'</div>
                        <div className="app-actions">
                            <button 
                                className="logout-btn" 
                                onClick={handleHomeClick}
                                aria-label="Return to home"
                            >
                                🚀
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="app-content">
                        {activeTab === 'swipe' && (
                            <div className="swipe-section">
                                <div className="card-container">
                                    {filteredGenderedUsers.length > 0 ? (
                                        filteredGenderedUsers.map((profile, index) => (
                                            <TinderCardContainer
                                                ref={(el) => (swipeRef.current[index] = el)}
                                                className={`swipe-card ${index !== currentIndex ? 'hidden-card' : ''}`}
                                                key={profile.user_id}
                                                onSwipe={(dir) => swiped(dir, profile.user_id, index)}
                                                onCardLeftScreen={() => outOfFrame(profile.first_name)}
                                                preventSwipe={['up', 'down']}
                                            >
                                                <div 
                                                    className="profile-card"
                                                    style={{
                                                        backgroundImage: `url(${profile.url || 'https://via.placeholder.com/400'})`
                                                    }}
                                                    aria-label={`Profile of ${profile.first_name}`}
                                                >
                                                    <div className="profile-info">
                                                        <h2>{profile.first_name}</h2>
                                                        <p className="profile-age">{profile.age || 'Age not specified'}</p>
                                                        <p className="profile-bio">{profile.about || "No bio yet"}</p>
                                                    </div>
                                                </div>
                                            </TinderCardContainer>
                                        ))
                                    ) : (
                                        <div className="no-profiles">
                                            <div className="empty-state">
                                                <span className="empty-icon">🔍</span>
                                                <h3>No more profiles</h3>
                                                <p>We're working hard to find more matches for you</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="swipe-buttons">
                                    <button 
                                        className="swipe-btn dislike" 
                                        onClick={swipeLeft}
                                        aria-label="Swipe left"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                    <button 
                                        className="swipe-btn like" 
                                        onClick={swipeRight}
                                        aria-label="Swipe right"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'matches' && (
                            <div className="matches-section">
                                <h2>Your Matches</h2>
                                <div className="matches-grid">
                                    {user.matches && user.matches.length > 0 ? (
                                        user.matches.map((match) => (
                                            <div 
                                                key={match.user_id} 
                                                className="match-card"
                                                onClick={() => {
                                                    setCurrentMatch(match);
                                                    setActiveTab('chat');
                                                    getChatMessages(match.user_id);
                                                }}
                                                aria-label={`Chat with ${match.first_name}`}
                                            >
                                                <div className="match-photo" style={{
                                                    backgroundImage: `url(${match.url || 'https://via.placeholder.com/150'})`,
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'center',
                                                    backgroundSize: 'cover'
                                                }} />
                                                <div className="match-info">
                                                    <p className="match-name">{match.first_name}</p>
                                                    {match.about && (
                                                        <p className="match-bio">{match.about.length > 30 ? `${match.about.substring(0, 30)}...` : match.about}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-matches">
                                            <div className="empty-state">
                                                <span className="empty-icon">❤️</span>
                                                <h3>No matches yet</h3>
                                                <p>Keep swiping to find your perfect match!</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'chat' && (
                            <div className="chat-section">
                                <div className="chat-header">
                                    <button 
                                        className="back-btn" 
                                        onClick={() => setActiveTab('matches')}
                                        aria-label="Back to matches"
                                    >
                                        ←
                                    </button>
                                    <h3>{currentMatch?.first_name || user.matches?.[0]?.first_name || 'Chat'}</h3>
                                </div>
                                
                                <div className="chat-messages">
                                    {chatMessages.length > 0 ? (
                                        chatMessages.map((message, index) => (
                                            <div 
                                                key={index} 
                                                className={`message ${message.from_userId === userId ? 'sent' : 'received'}`}
                                            >
                                                <p>{message.message}</p>
                                                <span className="message-time">
                                                    {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-messages">
                                            <p>Start a conversation with your match!</p>
                                        </div>
                                    )}
                                </div>
                                
                                <form onSubmit={handleMessageSubmit} className="chat-input">
                                    <input 
                                        type="text" 
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        aria-label="Type your message"
                                    />
                                    <button 
                                        type="submit" 
                                        className="send-btn"
                                        disabled={!newMessage.trim()}
                                        aria-label="Send message"
                                    >
                                        <span role="img" aria-label="send">📤</span>
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="profile-section">
                                <div className="profile-card large">
                                    <div 
                                        className="profile-photo" 
                                        style={{backgroundImage: `url(${user.url || 'https://via.placeholder.com/400'})`}}
                                        aria-label="Your profile photo"
                                    />
                                    <div className="profile-details">
                                        {!isEditingProfile ? (
                                            <>
                                                <h2>{user.first_name}</h2>
                                                <p className="profile-age">{user.age || 'Age not specified'}</p>
                                                <p className="profile-location">{user.location || 'Location not specified'}</p>
                                                <p className="profile-bio">{user.about || "No bio yet"}</p>
                                                <button 
                                                    className="edit-profile-btn hinge-style" 
                                                    onClick={toggleEditProfile}
                                                    aria-label="Edit profile"
                                                >
                                                    Edit Profile
                                                </button>
                                                <button 
                                                    className="edit-profile-btn hinge-style" 
                                                    onClick={handleLogout}
                                                    aria-label="Log out"
                                                    style={{ marginLeft: '10px', background: '#f1f1f1', color: '#333' }}
                                                >
                                                    Log Out
                                                </button>
                                            </>
                                        ) : (
                                            <div className="edit-profile-form">
                                                <div className="form-group">
                                                    <label htmlFor="first_name">Name</label>
                                                    <input 
                                                        type="text" 
                                                        id="first_name"
                                                        name="first_name" 
                                                        value={editedProfile.first_name || ''} 
                                                        onChange={handleProfileChange}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="age">Age</label>
                                                    <input 
                                                        type="number" 
                                                        id="age"
                                                        name="age" 
                                                        value={editedProfile.age || ''} 
                                                        onChange={handleProfileChange}
                                                        min="18"
                                                        max="100"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="location">Location</label>
                                                    <input 
                                                        type="text" 
                                                        id="location"
                                                        name="location" 
                                                        value={editedProfile.location || ''} 
                                                        onChange={handleProfileChange}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="about">About</label>
                                                    <textarea 
                                                        id="about"
                                                        name="about" 
                                                        value={editedProfile.about || ''} 
                                                        onChange={handleProfileChange}
                                                        rows="4"
                                                    ></textarea>
                                                </div>
                                                <div className="profile-actions">
                                                    <button 
                                                        type="button" 
                                                        className="cancel-btn" 
                                                        onClick={toggleEditProfile}
                                                        aria-label="Cancel editing"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className="save-btn" 
                                                        onClick={saveProfile}
                                                        aria-label="Save profile"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="app-nav">
                        <button 
                            className={`nav-btn ${activeTab === 'swipe' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('swipe')}
                            aria-label="Discover"
                            aria-current={activeTab === 'swipe' ? 'page' : undefined}
                        >
                            <span className="nav-icon">🔥</span>
                            <span className="nav-text">Discover</span>
                        </button>
                        <button 
                            className={`nav-btn ${activeTab === 'matches' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('matches')}
                            aria-label="Matches"
                            aria-current={activeTab === 'matches' ? 'page' : undefined}
                        >
                            <span className="nav-icon">❤️</span>
                            <span className="nav-text">Matches</span>
                        </button>
                        <button 
                            className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('chat')}
                            aria-label="Messages"
                            aria-current={activeTab === 'chat' ? 'page' : undefined}
                        >
                            <span className="nav-icon">💬</span>
                            <span className="nav-text">Messages</span>
                        </button>
                    </div>

                    {/* Match Animation Overlay */}
                    {matchAnimation && (
                        <div className="match-animation">
                            <div className="match-content">
                                <h2>It's a Match!</h2>
                                <p>You and {filteredGenderedUsers[currentIndex - 1]?.first_name} liked each other</p>
                                <div className="match-avatars">
                                    <div className="avatar-container">
                                        <img src={user.url || "https://via.placeholder.com/100"} alt="You" />
                                    </div>
                                    <div className="avatar-container">
                                        <img src={filteredGenderedUsers[currentIndex - 1]?.url || "https://via.placeholder.com/100"} alt="Match" />
                                    </div>
                                </div>
                                <div className="match-actions">
                                    <button 
                                        className="match-btn send-message" 
                                        onClick={() => {
                                            setCurrentMatch(filteredGenderedUsers[currentIndex - 1]);
                                            setActiveTab('chat');
                                            setMatchAnimation(false);
                                            getChatMessages(filteredGenderedUsers[currentIndex - 1]?.user_id);
                                        }}
                                        aria-label="Send message"
                                    >
                                        Send Message
                                    </button>
                                    <button 
                                        className="match-btn keep-swiping" 
                                        onClick={() => setMatchAnimation(false)}
                                        aria-label="Keep swiping"
                                    >
                                        Keep Swiping
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                /* Reset and Base Styles */
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                    font-family: 'Poppins', 'Segoe UI', sans-serif;
                }

                button {
                    cursor: pointer;
                    border: none;
                    outline: none;
                }

                .app-container {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    background: #f9f9f9;
                    position: relative;
                }

                /* Loading Overlay */
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid #fd297b;
                    border-radius: 50%;
                    border-top-color: transparent;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Header Styles */
                .app-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    background: linear-gradient(135deg, #fd297b, #ff5864, #ff655b);
                    color: white;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    position: relative;
                    z-index: 10;
                }

                .profile-thumbnail {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid white;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }

                .profile-thumbnail:hover {
                    transform: scale(1.1);
                }

                .app-name {
                    font-size: 24px;
                    font-weight: 700;
                    letter-spacing: 1px;
                }

                .logout-btn {
                    background: transparent;
                    color: white;
                    font-size: 24px;
                    padding: 8px;
                    border-radius: 50%;
                    transition: transform 0.2s ease;
                }

                .logout-btn:hover {
                    transform: rotate(15deg) scale(1.1);
                }

                /* Content Styles */
                .app-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    position: relative;
                }

                /* Swipe Section */
                .swipe-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                }

                .card-container {
                    width: 100%;
                    max-width: 400px;
                    height: 70vh;
                    position: relative;
                    margin-bottom: 20px;
                }

                .swipe-card {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    cursor: grab;
                }

                .swipe-card.hidden-card {
                    display: none;
                }

                .profile-card {
                    width: 100%;
                    height: 100%;
                    border-radius: 15px;
                    background-size: cover;
                    background-position: center;
                    position: relative;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }

                .profile-info {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 20px;
                    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
                    color: white;
                }

                .profile-info h2 {
                    margin-bottom: 5px;
                    font-size: 28px;
                }

                .profile-age {
                    font-size: 16px;
                    margin-bottom: 8px;
                }

                .profile-bio {
                    font-size: 16px;
                    opacity: 0.9;
                }

                .swipe-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    margin-top: 20px;
                }

                .swipe-btn {
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                }

                .swipe-btn:hover {
                    transform: scale(1.1);
                }

                .swipe-btn.like {
                    background: linear-gradient(45deg, #4CD964, #5AC8FA);
                    color: white;
                }

                .swipe-btn.dislike {
                    background: linear-gradient(45deg, #FF3B30, #FF2D55);
                    color: white;
                }

                /* Matches Section */
                .matches-section {
                    padding: 10px;
                }

                .matches-section h2 {
                    margin-bottom: 20px;
                    color: #333;
                    font-size: 24px;
                    text-align: center;
                }

                .matches-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 20px;
                }

                .match-card {
                    border-radius: 12px;
                    overflow: hidden;
                    background: white;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
                    transition: transform 0.2s ease;
                    cursor: pointer;
                }

                .match-card:hover {
                    transform: translateY(-5px);
                }

                .match-photo {
                    height: 180px;
                    width: 100%;
                    background-color: #e0e0e0;
                }

                .match-info {
                    padding: 12px;
                }

                .match-name {
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 5px;
                    font-size: 16px;
                }

                .match-bio {
                    color: #666;
                    font-size: 14px;
                    line-height: 1.3;
                }

                .no-matches, .no-profiles {
                    text-align: center;
                    padding: 40px 20px;
                    color: #888;
                }

                /* Empty State */
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    padding: 30px;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
                }

                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                }

                /* Profile Section */
                .profile-section {
                    padding: 10px;
                }

                .profile-card.large {
                    height: auto;
                    border-radius: 15px;
                    overflow: hidden;
                    background: white;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
                }

                .profile-age, .profile-location {
                    color: #666;
                    font-size: 16px;
                    margin-bottom: 8px;
                }

                .profile-bio {
                    margin: 15px 0;
                    line-height: 1.5;
                    color: #333;
                }

                .edit-profile-btn {
                    background: linear-gradient(135deg, #fd297b, #ff5864);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 30px;
                    font-weight: 600;
                    margin-top: 15px;
                    transition: all 0.2s ease;
                }

                .edit-profile-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(253, 41, 123, 0.3);
                }

                .edit-profile-form {
                    width: 100%;
                }

                .form-group {
                    margin-bottom: 15px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #333;
                }

                .form-group input,
                .form-group textarea {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 16px;
                }

                .form-group textarea {
                    min-height: 100px;
                    resize: vertical;
                }

                .profile-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                }

                .cancel-btn, .save-btn {
                    padding: 10px 20px;
                    border-radius: 30px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }

                .cancel-btn {
                    background: #f1f1f1;
                    color: #333;
                }

                .save-btn {
                    background: linear-gradient(135deg, #fd297b, #ff5864);
                    color: white;
                }

                .cancel-btn:hover, .save-btn:hover {
                    transform: translateY(-2px);
                }

                /* Chat Section */
                .chat-section {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .chat-header {
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    border-bottom: 1px solid #eee;
                    background: white;
                }

                .back-btn {
                    background: transparent;
                    font-size: 20px;
                    margin-right: 15px;
                    color: #333;
                }

                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .message {
                    max-width: 75%;
                    padding: 12px 15px;
                    border-radius: 18px;
                    position: relative;
                    margin-bottom: 5px;
                }

                .message.sent {
                    align-self: flex-end;
                    background: linear-gradient(135deg, #fd297b, #ff5864);
                    color: white;
                    border-bottom-right-radius: 4px;
                }

                .message.received {
                    align-self: flex-start;
                    background: #f1f1f1;
                    color: #333;
                    border-bottom-left-radius: 4px;
                }

                .message p {
                    margin: 0;
                    font-size: 16px;
                }

                .message-time {
                    display: block;
                    font-size: 12px;
                    opacity: 0.7;
                    margin-top: 5px;
                    text-align: right;
                }

                .no-messages {
                    text-align: center;
                    color: #888;
                    padding: 30px;
                }

                .chat-input {
                    display: flex;
                    padding: 15px;
                    background: white;
                    border-top: 1px solid #eee;
                }

                .chat-input input {
                    flex: 1;
                    padding: 12px 15px;
                    border: 1px solid #ddd;
                    border-radius: 25px;
                    font-size: 16px;
                    outline: none;
                }

                .send-btn {
                    width: 45px;
                    height: 45px;
                    background: linear-gradient(135deg, #fd297b, #ff5864);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-left: 10px;
                    font-size: 18px;
                    transition: all 0.2s ease;
                }

                .send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .send-btn:not(:disabled):hover {
                    transform: scale(1.1);
                }

                /* Navigation Bar */
                .app-nav {
                    display: flex;
                    justify-content: space-around;
                    background: white;
                    padding: 12px 0;
                    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
                    position: relative;
                    z-index: 10;
                }

                .nav-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: transparent;
                    color: #999;
                    transition: all 0.2s ease;
                    padding: 8px 0;
                    width: 33.33%;
                }

                .nav-btn.active {
                    color: #fd297b;
                }

                .nav-icon {
                    font-size: 24px;
                    margin-bottom: 5px;
                }

                .nav-text {
                    font-size: 12px;
                    font-weight: 500;
                }

                /* Match Animation */
                .match-animation {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .match-content {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                    animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                @keyframes popIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .match-content h2 {
                    color: #fd297b;
                    font-size: 32px;
                    margin-bottom: 10px;
                }

                .match-avatars {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin: 25px 0;
                }

                .avatar-container {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 3px solid #fd297b;
                }

                .avatar-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .match-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .match-btn {
                    padding: 12px;
                    border-radius: 30px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }

                .match-btn.send-message {
                    background: linear-gradient(135deg, #fd297b, #ff5864);
                    color: white;
                }

                .match-btn.keep-swiping {
                    background: #f1f1f1;
                    color: #333;
                }

                .match-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                }

                @media (max-width: 768px) {
                    .matches-grid {
                        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    }
                    
                    .profile-photo {
                        height: 200px;
                    }
                    
                    .card-container {
                        height: 60vh;
                    }
                }

                @media (max-width: 480px) {
                    .app-name {
                        font-size: 20px;
                    }
                    
                    .matches-grid {
                        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    }
                    
                    .swipe-btn {
                        width: 60px;
                        height: 60px;
                    }
                    
                    .match-avatars {
                        gap: 10px;
                    }
                    
                    .avatar-container {
                        width: 80px;
                        height: 80px;
                    }
                }
`}</style>
        </>
    );
};

Dashboard.propTypes = {
    user: PropTypes.shape({
        user_id: PropTypes.string,
        first_name: PropTypes.string,
        age: PropTypes.number,
        url: PropTypes.string,
        about: PropTypes.string,
        location: PropTypes.string,
        matches: PropTypes.arrayOf(
            PropTypes.shape({
                user_id: PropTypes.string,
                first_name: PropTypes.string,
                url: PropTypes.string,
                about: PropTypes.string
            })
        ),
        gender_interest: PropTypes.string
    })
};

export default Dashboard;