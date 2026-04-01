import { useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneHash, setPhoneHash] = useState(""); // OTP verify karne ke liye zaroori
  const [showOtp, setShowOtp] = useState(false);

  // --- 1. Telegram OTP Mangwane ka Logic ---
  const handleGetOTP = async () => {
    const phone = document.getElementById('phone').value;
    const apiId = document.getElementById('apiId').value;
    const apiHash = document.getElementById('apiHash').value;

    if (!phone || !apiId || !apiHash) return alert("Pehle API ID, Hash aur Phone bhariye!");

    setLoading(true);
    setStatus("OTP bhej rahe hain...");

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendCode', phone, apiId, apiHash })
      });
      const data = await res.json();

      if (data.success) {
        setPhoneHash(data.hash); // Backend se aaya hash save karein
        setShowOtp(true);
        setStatus("✅ OTP Sent! Jaldi enter karein (Expire ho jata hai).");
      } else {
        setStatus("❌ Error: " + data.error);
      }
    } catch (err) {
      setStatus("❌ Connection failed!");
    }
    setLoading(false);
  };

  // --- 2. OTP Verify aur Firebase mein Save karne ka Logic ---
  const handleVerifyOTP = async () => {
    const otp = document.getElementById('otp').value;
    const phone = document.getElementById('phone').value;
    const apiId = document.getElementById('apiId').value;
    const apiHash = document.getElementById('apiHash').value;

    if (!otp) return alert("OTP toh daalo bhai!");

    setLoading(true);
    setStatus("Verify kar rahe hain...");

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'verifyCode', 
          phone, 
          otp, 
          hash: phoneHash, // Piche wala hash yaha bhejna zaroori hai
          apiId, 
          apiHash 
        })
      });
      const data = await res.json();

      if (data.success) {
        setStatus("🚀 LOGIN SUCCESS! Session Firebase mein save ho gaya.");
        setShowOtp(false);
      } else {
        setStatus("❌ Error: " + data.error);
      }
    } catch (err) {
      setStatus("❌ Verification failed!");
    }
    setLoading(false);
  };

  // --- 3. Batch Poll Bhejne ka Logic ---
  const handleBatchSend = async () => {
    const list = document.getElementById('pollList').value.split('\n');
    const target = document.getElementById('target').value;
    const botToken = document.getElementById('botToken').value;

    if (!target || !botToken) return alert("Bot Token aur Target zaroori hai!");

    setLoading(true);
    setStatus("🚀 Sending Polls...");

    for (let item of list) {
      if (!item.trim()) continue;
      const [question, options] = item.split('|');

      await fetch('/api/send-poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken,
          target,
          question,
          options: options ? options.split(',') : []
        })
      });
      await new Promise(r => setTimeout(r, 2000)); // 2 sec gap
    }
    setStatus("✅ Saare Polls bhej diye gaye!");
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h1 style={{ textAlign: 'center', color: '#0088cc' }}>BaseKey Batch Sender</h1>

      <div style={cardStyle}>
        <h3>1. Setup & Login</h3>
        <input id="apiId" placeholder="API ID" style={inputStyle} />
        <input id="apiHash" placeholder="API Hash" style={inputStyle} />
        <input id="phone" placeholder="+91XXXXXXXXXX" style={inputStyle} />
        <button onClick={handleGetOTP} disabled={loading} style={btnStyle}>
          {loading ? "Waiting..." : "Get OTP Code"}
        </button>

        {showOtp && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#e7f3ff', borderRadius: '8px' }}>
            <input id="otp" placeholder="Enter OTP" style={inputStyle} />
            {/* AB YE BUTTON KAAM KAREGA */}
            <button onClick={handleVerifyOTP} disabled={loading} style={{ ...btnStyle, background: '#28a745' }}>
              {loading ? "Verifying..." : "Verify & Save"}
            </button>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h3>2. Batch Send Polls</h3>
        <input id="botToken" placeholder="Bot Token" style={inputStyle} />
        <input id="target" placeholder="@username or Chat ID" style={inputStyle} />
        <textarea id="pollList" rows="6" placeholder="Sawal|Opt1,Opt2" style={inputStyle}></textarea>
        <button onClick={handleBatchSend} disabled={loading} style={{ ...btnStyle, background: '#0088cc' }}>
          🚀 Start Sending All
        </button>
      </div>

      <p style={{ textAlign: 'center', fontWeight: 'bold', color: '#0088cc' }}>
        Status: {status}
      </p>
    </div>
  );
}

const cardStyle = { background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };
const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '12px', background: '#0088cc', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
