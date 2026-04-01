import { TelegramClient, Api } from "telegram"; // Api ko yaha add kiya hai
import { StringSession } from "telegram/sessions";
import { ref, update } from "firebase/database";
import db from "../lib/firebase";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { action, phone, otp, apiId, apiHash, hash } = req.body;
    const session = new StringSession("");
    const client = new TelegramClient(session, parseInt(apiId), apiHash, { 
        connectionRetries: 5 
    });

    try {
        await client.connect();

        // --- 1. OTP Mangwane ka Logic ---
        if (action === 'sendCode') {
            const result = await client.sendCode({ 
                apiId: parseInt(apiId), 
                apiHash 
            }, phone);
            
            // phoneCodeHash ko frontend par bhej rahe hain
            return res.json({ success: true, hash: result.phoneCodeHash });
        } 

        // --- 2. OTP Verify karke Session Save karne ka Logic ---
        else if (action === 'verifyCode') {
            // client.signIn ki jagah ye direct Api call use karein (Error Fix)
            await client.invoke(
                new Api.auth.SignIn({
                    phoneNumber: phone,
                    phoneCodeHash: hash,
                    phoneCode: otp,
                })
            );
            
            const sessionString = client.session.save();

            // Firebase Client SDK syntax
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
        // Vercel par connection close karna zaroori hai
        await client.disconnect();
    }
}
