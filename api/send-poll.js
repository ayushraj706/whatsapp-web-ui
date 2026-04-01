import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { ref, get, child } from "firebase/database";
import db from "../lib/firebase";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // 'type' field se hum decide karenge ki Poll bhejna hai ya Message
    const { type, target, question, options, message, apiId, apiHash } = req.body;

    try {
        // 1. Firebase se saved session uthayein
        const snapshot = await get(child(ref(db), 'settings'));
        if (!snapshot.exists() || !snapshot.val().session) {
            return res.status(400).json({ success: false, error: "Pehle login karein!" });
        }

        const savedSession = snapshot.val().session;
        const session = new StringSession(savedSession);
        const client = new TelegramClient(session, parseInt(apiId), apiHash, { connectionRetries: 5 });

        await client.connect();

        // 2. Logic: Poll vs Formatted Message
        if (type === 'poll') {
            // Poll bhejne ka logic
            await client.sendMessage(target, {
                file: new Api.InputMediaPoll({
                    poll: new Api.Poll({
                        id: BigInt(Math.floor(Math.random() * 10000000)),
                        question: question,
                        answers: options.map(opt => new Api.PollAnswer({ 
                            text: opt, 
                            option: Buffer.from(opt) 
                        })),
                        publicVoters: true
                    })
                })
            });
        } else {
            // Normal Formatted Message (HTML Support)
            await client.sendMessage(target, {
                message: message,
                parseMode: 'html' // Yaha se <b>, <i>, <a> tags kaam karenge
            });
        }

        await client.disconnect();
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Sending Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
}
