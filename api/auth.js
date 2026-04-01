import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import db from "../lib/firebase"; // Aapka purana firebase file

let phoneCodeHash; // Temporary store

export default async function handler(req, res) {
    const { action, phone, otp, apiId, apiHash } = req.body;
    const session = new StringSession("");
    const client = new TelegramClient(session, parseInt(apiId), apiHash, { connectionRetries: 5 });

    try {
        await client.connect();

        if (action === 'sendCode') {
            // OTP bhejne ka logic
            const result = await client.sendCode({ apiId: parseInt(apiId), apiHash }, phone);
            phoneCodeHash = result.phoneCodeHash;
            res.json({ success: true, hash: phoneCodeHash });
        } 
        else if (action === 'verifyCode') {
            // OTP verify karke session nikalne ka logic
            await client.signIn({
                phoneNumber: phone,
                phoneCodeHash: req.body.hash,
                phoneCode: otp,
            });
            
            const sessionString = client.session.save();
            // Firebase mein save karna
            await db.ref('settings').update({ session: sessionString });
            
            res.json({ success: true, session: sessionString });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

