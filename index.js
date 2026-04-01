const express = require('express');
const bodyParser = require('body-parser');
const { connectTelegram, getClient } = require('./lib/telegram');
const db = require('./lib/firebase');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// --- Route: Setup API Credentials ---
app.post('/api/setup', async (req, res) => {
    const { apiId, apiHash, botToken, session } = req.body;
    try {
        await db.ref('config').set({ apiId, apiHash, botToken, session });
        await connectTelegram(apiId, apiHash, session, botToken);
        res.json({ success: true, message: "Connected successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Route: Send Command/Message via Dashboard ---
app.post('/api/command', async (req, res) => {
    const { target, message } = req.body;
    const client = getClient();
    if (!client) return res.status(400).send("Not connected");

    try {
        await client.sendMessage(target, { message: message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(3000, () => console.log("Server: http://localhost:3000"));
