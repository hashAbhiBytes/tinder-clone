require('dotenv').config();

const express = require('express');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 8000;
const uri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'; // Set this in your .env file

const app = express();
app.use(cors());
app.use(express.json());

// Helper: Connect to MongoDBā
const getClient = () => {
    return new MongoClient(uri, {
        tls: true,
        tlsAllowInvalidCertificates: true,
    });
};

// Default route
app.get('/', (req, res) => {
    res.json('Hello to my app');
});

// Sign Up
app.post('/signup', async (req, res) => {
    const client = getClient();
    const { email, password } = req.body;

    try {
        await client.connect();
        const db = client.db('app-data');
        const users = db.collection('users');

        const existingUser = await users.findOne({ email });
        if (existingUser) return res.status(409).send('User already exists. Please login.');

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        const sanitizedEmail = email.toLowerCase();

        const userData = {
            user_id: userId,
            email: sanitizedEmail,
            hashed_password: hashedPassword,
        };

        await users.insertOne(userData);

        const token = jwt.sign({ user_id: userId, email }, jwtSecret, { expiresIn: '1d' });
        res.status(201).json({ token, userId });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error signing up user');
    } finally {
        await client.close();
    }
});

// Login
app.post('/login', async (req, res) => {
    const client = getClient();
    const { email, password } = req.body;

    try {
        await client.connect();
        const db = client.db('app-data');
        const users = db.collection('users');

        const user = await users.findOne({ email });
        if (!user) return res.status(400).json('Invalid credentials');

        const isPasswordCorrect = await bcrypt.compare(password, user.hashed_password);
        if (!isPasswordCorrect) return res.status(400).json('Invalid credentials');

        const token = jwt.sign({ user_id: user.user_id, email }, jwtSecret, { expiresIn: '1d' });
        res.status(200).json({ token, userId: user.user_id });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error logging in');
    } finally {
        await client.close();
    }
});

// Get user by ID
app.get('/user', async (req, res) => {
    const client = getClient();
    const userId = req.query.userId;

    try {
        await client.connect();
        const db = client.db('app-data');
        const users = db.collection('users');

        const user = await users.findOne({ user_id: userId });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching user');
    } finally {
        await client.close();
    }
});

// Update user profile
app.put('/user', async (req, res) => {
    const client = getClient();
    const formData = req.body.formData;

    try {
        await client.connect();
        const db = client.db('app-data');
        const users = db.collection('users');

        const query = { user_id: formData.user_id };
        const update = {
            $set: {
                first_name: formData.first_name,
                dob_day: formData.dob_day,
                dob_month: formData.dob_month,
                dob_year: formData.dob_year,
                show_gender: formData.show_gender,
                gender_identity: formData.gender_identity,
                gender_interest: formData.gender_interest,
                url: formData.url,
                about: formData.about,
                matches: formData.matches,
            },
        };

        const result = await users.updateOne(query, update);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating user');
    } finally {
        await client.close();
    }
});

// Add match
app.put('/addmatch', async (req, res) => {
    const client = getClient();
    const { userId, matchedUserId } = req.body;

    try {
        await client.connect();
        const db = client.db('app-data');
        const users = db.collection('users');

        const result = await users.updateOne(
            { user_id: userId },
            { $push: { matches: { user_id: matchedUserId } } }
        );
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding match');
    } finally {
        await client.close();
    }
});

// Get users by userIds
app.get('/users', async (req, res) => {
    const client = getClient();
    const userIds = JSON.parse(req.query.userIds);

    try {
        await client.connect();
        const db = client.db('app-data');
        const users = db.collection('users');

        const foundUsers = await users
            .find({ user_id: { $in: userIds } })
            .toArray();
        res.json(foundUsers);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching users');
    } finally {
        await client.close();
    }
});

// Get gendered users
app.get('/gendered-users', async (req, res) => {
    const client = getClient();
    const gender = req.query.gender;

    try {
        await client.connect();
        const db = client.db('app-data');
        const users = db.collection('users');

        const foundUsers = await users
            .find({ gender_identity: gender })
            .toArray();
        res.json(foundUsers);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching gendered users');
    } finally {
        await client.close();
    }
});

// Get messages between two users
app.get('/messages', async (req, res) => {
    const client = getClient();
    const { userId, correspondingUserId } = req.query;

    try {
        await client.connect();
        const db = client.db('app-data');
        const messages = db.collection('messages');

        const foundMessages = await messages
            .find({ from_userId: userId, to_userId: correspondingUserId })
            .toArray();
        res.json(foundMessages);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching messages');
    } finally {
        await client.close();
    }
});

// Add a message
app.post('/message', async (req, res) => {
    const client = getClient();
    const { from_userId, to_userId, message } = req.body;

    try {
        await client.connect();
        const db = client.db('app-data');
        const messages = db.collection('messages');

        const newMessage = {
            from_userId,
            to_userId,
            message,
            timestamp: new Date()
        };

        const result = await messages.insertOne(newMessage);
        res.json(newMessage);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error sending message');
    } finally {
        await client.close();
    }
});


app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
