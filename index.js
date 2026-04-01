<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BaseKey Batch Poll Sender</title>
    <style>
        body { font-family: sans-serif; padding: 20px; background: #f4f4f9; }
        .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        input, textarea, button { width: 100%; padding: 12px; margin: 8px 0; border-radius: 5px; border: 1px solid #ddd; box-sizing: border-box; }
        button { background: #0088cc; color: white; font-weight: bold; cursor: pointer; border: none; }
        #status { color: green; font-weight: bold; }
    </style>
</head>
<body>
    <h1>BaseKey Telegram Batch Sender</h1>
    
    <div class="card">
        <h3>1. Setup (API ID/Hash/Token)</h3>
        <input type="text" id="apiId" placeholder="API ID">
        <input type="text" id="apiHash" placeholder="API Hash">
        <input type="text" id="botToken" placeholder="Bot Token">
        <input type="text" id="session" placeholder="Session String (GramJS)">
    </div>

    <div class="card">
        <h3>2. Batch Send Polls</h3>
        <input type="text" id="target" placeholder="@username or Chat ID">
        <textarea id="pollList" rows="10" placeholder="Ek line mein ek poll likhein...
Example:
Bharat ki Rajdhani kya hai?|Delhi,Mumbai,Kolkata
Sabse bada grah kaunsa hai?|Jupiter,Mars,Earth"></textarea>
        <button id="sendBtn" onclick="startBatchSend()">Start Sending All</button>
        <p id="status"></p>
    </div>

    <script>
        async function startBatchSend() {
            const btn = document.getElementById('sendBtn');
            const status = document.getElementById('status');
            const list = document.getElementById('pollList').value.split('\n');
            const target = document.getElementById('target').value;

            btn.disabled = true;
            status.innerText = "Sending... Please wait.";

            for (let item of list) {
                if (!item.trim()) continue;
                
                const [question, options] = item.split('|');
                const body = {
                    apiId: document.getElementById('apiId').value,
                    apiHash: document.getElementById('apiHash').value,
                    botToken: document.getElementById('botToken').value,
                    session: document.getElementById('session').value,
                    target: target,
                    question: question,
                    options: options ? options.split(',') : []
                };

                // Vercel API ko call karna
                await fetch('/api/send-poll', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(body)
                });
                
                // 2 second ka gap taaki Telegram block na kare
                await new Promise(r => setTimeout(r, 2000));
            }

            status.innerText = "✅ All polls sent successfully!";
            btn.disabled = false;
        }
    </script>
</body>
</html>
        
