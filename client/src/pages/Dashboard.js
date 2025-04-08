import TinderCard from '../components/TinderCard';
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

    return (
        <>
            {user && (
                <div className="dashboard">
                    <ChatContainer user={user} />
                    <div className="swipe-container">
                        <div className="card-container">
                            {filteredGenderedUsers.map((genderedUser) => (
                                <TinderCard
                                    className="swipe"
                                    key={genderedUser.user_id}
                                    onSwipe={(dir) => swiped(dir, genderedUser.user_id)}
                                    onCardLeftScreen={(dir) => outOfFrame(genderedUser.first_name)}
                                >
                                    <div
                                        className="card"
                                        style={{
                                            backgroundImage: `url(${genderedUser.url || 'https://via.placeholder.com/300'})`,
                                        }}
                                    >
                                        <h3>{genderedUser.first_name}</h3>
                                    </div>
                                </TinderCard>
                            ))}
                            <div className="swipe-info">
                                {lastDirection && <p>You swiped {lastDirection}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
