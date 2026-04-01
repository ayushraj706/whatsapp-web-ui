import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { ref, get, child } from "firebase/database";
import db from "../lib/firebase";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // Frontend se aane waale saare fields
    const { type, target, question, options, correctIndex, message, apiId, apiHash } = req.body;

    try {
        // 1. Firebase se Saved Session uthayein
        const snapshot = await get(child(ref(db), 'settings'));
        if (!snapshot.exists() || !snapshot.val().session) {
            return res.status(400).json({ success: false, error: "Pehle Dashboard se Login karein!" });
        }

        const savedSession = snapshot.val().session;
        const client = new TelegramClient(
            new StringSession(savedSession), 
            parseInt(apiId), 
            apiHash, 
            { connectionRetries: 5 }
        );

        await client.connect();

        // 2. Automation Logic
        if (type === 'poll') {
            // --- QUIZ MODE POLL ---
            // client.invoke use kar rahe hain taaki Quiz features (Correct Answer) kaam karein
            await client.invoke(
                new Api.messages.SendMedia({
                    peer: target,
                    media: new Api.InputMediaPoll({
                        poll: new Api.Poll({
                            id: BigInt(Math.floor(Math.random() * 100000000)),
                            question: question,
                            answers: options.map(opt => new Api.PollAnswer({ 
                                text: opt, 
                                option: Buffer.from(opt) 
                            })),
                            quiz: true, // Ise Quiz banata hai
                            publicVoters: false // Quiz hamesha private voters ke saath accha lagta hai
                        }),
                        // Sahi jawab ka logic: options array mein se sahi index uthayega
                        correctAnswers: [Buffer.from(options[parseInt(correctIndex) || 0])]
                    })
                })
            );
        } else {
            // --- HTML FORMATTED MESSAGE ---
            await client.sendMessage(target, {
                message: message,
                parseMode: 'html' // Yaha se <b>, <i>, <a> tags kaam karenge
            });
        }

        // 3. Connection close karein taaki Vercel function hang na ho
        await client.disconnect();
        return res.status(200).json({ success: true });

    } catch (err) {
        console.error("Sending Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
