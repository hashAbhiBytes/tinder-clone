import { TinderCardContainer } from '../components/TinderCard';
import { useEffect, useState } from 'react';
import ChatContainer from '../components/ChatContainer';
import { useCookies } from 'react-cookie';
import axios from 'axios';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [genderedUsers, setGenderedUsers] = useState([]);
    const [lastDirection, setLastDirection] = useState();
    const [cookies] = useCookies(['user']);

    const userId = cookies?.UserId;

    const getUser = async () => {
        try {
            const response = await axios.get('http://localhost:8000/user', {
                params: { userId },
            });
            setUser(response.data);
        } catch (error) {
            console.log('Error fetching user:', error);
        }
    };

    const getGenderedUsers = async () => {
        if (!user?.gender_interest) return;
        try {
            const response = await axios.get('http://localhost:8000/gendered-users', {
                params: { gender: user.gender_interest },
            });
            setGenderedUsers(response.data);
        } catch (error) {
            console.log('Error fetching gendered users:', error);
        }
    };

    useEffect(() => {
        if (userId) {
            getUser();
        }
    }, [userId]);

    useEffect(() => {
        if (user) {
            getGenderedUsers();
        }
    }, [user]);

    const updateMatches = async (matchedUserId) => {
        try {
            await axios.put('http://localhost:8000/addmatch', {
                userId,
                matchedUserId,
            });
            getUser(); // Refresh user data after match
        } catch (error) {
            console.log('Error updating matches:', error);
        }
    };

    const swiped = (direction, swipedUserId) => {
        if (direction === 'right') {
            updateMatches(swipedUserId);
        }
        setLastDirection(direction);
    };

    const outOfFrame = (name) => {
        console.log(`${name} left the screen!`);
    };

    const matchedUserIds = user?.matches?.map((match) => match.user_id) || [];
    const filteredGenderedUsers = genderedUsers.filter(
        (genderedUser) =>
            !matchedUserIds.includes(genderedUser.user_id) &&
            genderedUser.user_id !== userId
    );

    // CSS Styles
    const styles = {
        dashboard: {
            display: 'flex',
            justifyContent: 'space-between',
            maxWidth: '1200px',
            margin: '0 auto',
            height: '100vh',
        },
        swipeContainer: {
            width: '70%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            padding: '20px',
        },
        cardContainer: {
            width: '400px',
            height: '650px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        },
        swipe: {
            position: 'absolute',
            width: '100%',
            height: '100%',
        },
        card: {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: '380px',
            height: '480px',
            borderRadius: '20px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            position: 'relative',
        },
        cardGradient: {
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            padding: '20px',
            borderRadius: '0 0 20px 20px',
        },
        cardName: {
            color: 'white',
            margin: '0',
            fontSize: '24px',
        },
        swipeInfo: {
            width: '100%',
            padding: '10px',
            marginTop: '500px',
        },
        swipeNotification: (direction) => ({
            textAlign: 'center',
            marginTop: '20px',
            padding: '10px',
            background: direction === 'right' ? '#E0F4E0' : '#FFEBEE',
            color: direction === 'right' ? '#2E7D32' : '#C62828',
            borderRadius: '20px',
            fontWeight: 'bold',
        }),
    };

    // Add media query styles for mobile
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        styles.dashboard.flexDirection = 'column';
        styles.swipeContainer.width = '100%';
        styles.swipeContainer.height = '65vh';
        styles.cardContainer.width = '300px';
        styles.cardContainer.height = '500px';
        styles.card.width = '280px';
        styles.card.height = '380px';
        styles.swipeInfo.marginTop = '400px';
    }

    return (
        <>
            {user && (
                <div style={styles.dashboard} className="dashboard">
                    <ChatContainer user={user} />
                    <div style={styles.swipeContainer} className="swipe-container">
                        <div style={styles.cardContainer} className="card-container">
                            {filteredGenderedUsers.map((genderedUser) => (
                                <TinderCardContainer
                                    style={styles.swipe}
                                    className="swipe"
                                    key={genderedUser.user_id}
                                    onSwipe={(dir) => swiped(dir, genderedUser.user_id)}
                                    onCardLeftScreen={() => outOfFrame(genderedUser.first_name)}
                                    preventSwipe={['up', 'down']}
                                >
                                    <div
                                        style={{
                                            ...styles.card,
                                            backgroundImage: `url(${genderedUser.url || 'https://via.placeholder.com/300'})`,
                                        }}
                                        className="card"
                                    >
                                        <div style={styles.cardGradient}>
                                            <h3 style={styles.cardName}>
                                                {genderedUser.first_name}
                                            </h3>
                                        </div>
                                    </div>
                                </TinderCardContainer>
                            ))}
                            <div style={styles.swipeInfo} className="swipe-info">
                                {lastDirection && (
                                    <p style={styles.swipeNotification(lastDirection)}>
                                        You swiped {lastDirection}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;