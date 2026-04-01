import { useState } from 'react';

export default function Home() {
    const [status, setStatus] = useState("");
    const [phoneHash, setPhoneHash] = useState("");
    const [loading, setLoading] = useState(false);

    // --- 1. OTP Mangwane ka Logic ---
    const handleSendOTP = async () => {
        const phone = document.getElementById('phone').value;
        const apiId = document.getElementById('apiId').value;
        const apiHash = document.getElementById('apiHash').value;

        if (!phone || !apiId || !apiHash) return alert("Pehle API ID, Hash aur Phone bhariye!");

        setLoading(true);
        setStatus("OTP bhej rahe hain... kripya intezar karein.");
        
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'sendCode', phone, apiId, apiHash })
            });
            const data = await res.json();
            
            if(data.success) {
                setPhoneHash(data.hash);
                setStatus("✅ OTP bhej diya gaya! Telegram check karein.");
                document.getElementById('otpDiv').style.display = 'block';
            } else {
                setStatus("❌ Error: " + data.error);
            }
        } catch (err) {
            setStatus("❌ Connection Error!");
        }
        setLoading(false);
    };

    // --- 2. Batch Poll Bhejne ka Logic ---
    const handleBatchSend = async () => {
        const list = document.getElementById('pollList').value.split('\n');
        const target = document.getElementById('target').value;
        const botToken = document.getElementById('botToken').value;

        if (!target || !botToken) return alert("Bot Token aur Target (@username) zaroori hai!");

        setLoading(true);
        setStatus("🚀 Batch sending chalu hai...");

        for (let item of list) {
            if(!item.trim()) continue;
            const [q, opt] = item.split('|');
            
            await fetch('/api/send-poll', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    botToken,
                    target,
                    question: q,
                    options: opt ? opt.split(',') : []
                })
            });
            // 2 second ka gap taaki Telegram spam na samjhe
            await new Promise(r => setTimeout(r, 2000));
        }
        setStatus("✅ Saare messages/polls bhej diye gaye!");
        setLoading(false);
    };

    return (
        <div style={containerStyle}>
            <h1>BaseKey Telegram Bridge</h1>
            
            {/* API & LOGIN SECTION */}
            <div className="card" style={cardStyle}>
                <h3>🔑 Step 1: Login (OTP via Dashboard)</h3>
                <input id="apiId" placeholder="API ID" style={inputStyle} />
                <input id="apiHash" placeholder="API Hash" style={inputStyle} />
                <input id="phone" placeholder="+91XXXXXXXXXX" style={inputStyle} />
                <button onClick={handleSendOTP} disabled={loading} style={btnStyle}>
                    {loading ? "Processing..." : "Get OTP Code"}
                </button>
                
                <div id="otpDiv" style={{ display: 'none', marginTop: '15px' }}>
                    <input id="otp" placeholder="Enter 5-digit OTP" style={inputStyle} />
                    <button style={btnStyle}>Verify & Save Session</button>
                </div>
            </div>

            {/* BATCH SENDER SECTION */}
            <div className="card" style={cardStyle}>
                <h3>📊 Step 2: Batch Poll Sender</h3>
                <input id="botToken" placeholder="Bot Token" style={inputStyle} />
                <input id="target" placeholder="Chat ID / @username" style={inputStyle} />
                <textarea id="pollList" placeholder="Sawal|Option1,Option2 (Ek line mein ek poll)" rows="5" style={inputStyle}></textarea>
                <button onClick={handleBatchSend} disabled={loading} style={{...btnStyle, background: '#28a745'}}>
                    🚀 Send All Polls Now
                </button>
            </div>

            <p style={{textAlign: 'center', fontWeight: 'bold', color: '#0088cc'}}>
                Status: {status}
            </p>
        </div>
    );
}

// --- Simple Inline CSS Styles ---
const containerStyle = { fontFamily: 'sans-serif', padding: '20px', maxWidth: '500px', margin: 'auto' };
const cardStyle = { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '12px', background: '#0088cc', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };

