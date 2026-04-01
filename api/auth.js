import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { ref, update } from "firebase/database";
import db from "../lib/firebase"; // Client SDK wala path

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { action, phone, otp, apiId, apiHash, hash } = req.body;
    const session = new StringSession("");
    const client = new TelegramClient(session, parseInt(apiId), apiHash, { 
        connectionRetries: 5 
    });

    try {
        await client.connect();

        // --- 1. OTP Bhejne ka logic ---
        if (action === 'sendCode') {
            const result = await client.sendCode({ 
                apiId: parseInt(apiId), 
                apiHash 
            }, phone);
            
            // phoneCodeHash ko frontend par bhej rahe hain taaki verify ke waqt wapas mile
            return res.json({ success: true, hash: result.phoneCodeHash });
        } 

        // --- 2. OTP Verify karke Session Save karne ka logic ---
        else if (action === 'verifyCode') {
            await client.signIn({
                phoneNumber: phone,
                phoneCodeHash: hash, // Frontend se aaya hua hash
                phoneCode: otp,
            });
            
            const sessionString = client.session.save();

            // Firebase Client SDK syntax: update(ref(db, 'path'), data)
            await update(ref(db, 'settings'), { 
                session: sessionString,
                lastLogin: new Date().toLocaleString()
            });
            
            return res.json({ success: true, session: sessionString });
        }
    } catch (err) {
        console.error("Telegram Auth Error:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        // Connection band karna zaroori hai Vercel par memory bachane ke liye
        await client.disconnect();
    }
}
