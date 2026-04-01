import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { ref, update, get, child } from "firebase/database"; // get aur child add kiya
import db from "../lib/firebase";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { action, phone, otp, apiId, apiHash, hash } = req.body;

    try {
        // --- 1. OTP Mangwane ka Logic ---
        if (action === 'sendCode') {
            const session = new StringSession(""); 
            const client = new TelegramClient(session, parseInt(apiId), apiHash, { connectionRetries: 5 });
            
            await client.connect();
            const result = await client.sendCode({ apiId: parseInt(apiId), apiHash }, phone);
            
            // Temporary Session ko save karna zaroori hai
            const tempSession = client.session.save();

            // Firebase mein is context ko save karein taaki Vercel bhule nahi
            await update(ref(db, `temp_auth/${phone.replace('+', '')}`), {
                hash: result.phoneCodeHash,
                session: tempSession
            });

            await client.disconnect();
            return res.json({ success: true, hash: result.phoneCodeHash });
        } 

        // --- 2. OTP Verify karne ka Logic ---
        else if (action === 'verifyCode') {
            // Firebase se purana context load karein
            const snapshot = await get(child(ref(db), `temp_auth/${phone.replace('+', '')}`));
            
            if (!snapshot.exists()) {
                throw new Error("Session expire ho gaya. Phir se OTP mangwayein.");
            }

            const { session: savedSession, hash: savedHash } = snapshot.val();
            const session = new StringSession(savedSession); // Wahi purana session load kiya
            const client = new TelegramClient(session, parseInt(apiId), apiHash, { connectionRetries: 5 });

            await client.connect();

            // Direct API call taaki context mismatch na ho
            await client.invoke(
                new Api.auth.SignIn({
                    phoneNumber: phone,
                    phoneCodeHash: savedHash,
                    phoneCode: otp,
                })
            );
            
            const finalSession = client.session.save();

            // Final Session ko permanent save karein
            await update(ref(db, 'settings'), { 
                session: finalSession,
                lastLogin: new Date().toLocaleString()
            });

            // Kaam khatam, temp data delete kar sakte hain (Optional)
            await client.disconnect();
            return res.json({ success: true, session: finalSession });
        }
    } catch (err) {
        console.error("Telegram Auth Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
}
