const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const db = require('./lib/firebase');
const { initTelegram, getClient } = require('./lib/telegram');
const config = require('./config');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// 1. Setup API Route
app.post('/api/setup', async (req, res) => {
    const { apiId, apiHash, botToken, session } = req.body;
    try {
        await db.ref('settings').set({ apiId, apiHash, botToken, session });
        await initTelegram(apiId, apiHash, session, botToken);
        res.json({ success: true, message: "Connected Successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Schedule Message Route
app.post('/api/schedule', async (req, res) => {
    const { target, message, time } = req.body;
    try {
        await db.ref('schedules').push({
            target,
            message,
            time,
            status: 'pending'
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// 3. Scheduling Engine (Every Minute)
cron.schedule('* * * * *', async () => {
    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    const snapshot = await db.ref('schedules').orderByChild('status').equalTo('pending').once('value');
    const client = getClient();

    if (!client) return;

    snapshot.forEach((child) => {
        const data = child.val();
        if (data.time === now) {
            client.sendMessage(data.target, { message: data.message })
                .then(() => {
                    child.ref.update({ status: 'sent' });
                    console.log("Message sent to: " + data.target);
                })
                .catch(err => console.error(err));
        }
    });
});

app.listen(config.serverPort, () => {
    console.log("Dashboard: http://localhost:" + config.serverPort);
});
