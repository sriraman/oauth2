const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const querystring = require('querystring');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const SECRET_KEY = 'your_secret_key';
const CLIENT_ID = 'your_client_id';
const CLIENT_SECRET = 'your_client_secret';
const REDIRECT_URI = 'https://abc.com';

// Mock user database and authorization codes
const users = [{ username: 'user1', password: 'pass1' }];
const authCodes = new Map();

// Authorization endpoint
app.get('/authorize', (req, res) => {
    const { response_type, client_id, redirect_uri, state } = req.query;

    if (response_type !== 'code' || client_id !== CLIENT_ID || redirect_uri !== REDIRECT_URI) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    // Mock login (you can replace this with a proper login form)
    const username = 'user1'; // Normally, you'd prompt the user to log in.
    const code = Math.random().toString(36).substring(7); // Generate auth code
    authCodes.set(code, { username });

    // Redirect to the client with the authorization code
    const redirectQuery = querystring.stringify({ code, state });
    res.redirect(`${redirect_uri}?${redirectQuery}`);
});

// Token endpoint
app.post('/token', (req, res) => {
    const { code, client_id, client_secret, redirect_uri, grant_type } = req.body;

    if (grant_type !== 'authorization_code' || client_id !== CLIENT_ID || client_secret !== CLIENT_SECRET || redirect_uri !== REDIRECT_URI) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    const authData = authCodes.get(code);
    if (!authData) {
        return res.status(400).json({ error: 'Invalid authorization code' });
    }

    // Generate access token
    const token = jwt.sign({ username: authData.username }, SECRET_KEY, { expiresIn: '1h' });
    authCodes.delete(code); // Consume the auth code
    res.json({ access_token: token, token_type: 'Bearer', expires_in: 3600 });
});

// Protected route example
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

// Start the server
app.listen(3000, () => console.log('OAuth server running on http://localhost:3000'));
