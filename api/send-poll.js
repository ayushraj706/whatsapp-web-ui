export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { botToken, target, question, options } = req.body;

    try {
        // Telegram Bot API ka use karke Poll bhejna
        const url = `https://api.telegram.org/bot${botToken}/sendPoll`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: target,
                question: question,
                options: options,
                is_anonymous: false
            })
        });

        const data = await response.json();
        if (data.ok) {
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false, error: data.description });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

