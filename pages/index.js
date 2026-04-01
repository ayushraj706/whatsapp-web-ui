import { useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phoneHash, setPhoneHash] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [sendType, setSendType] = useState("poll"); // "poll" or "text"

  // --- 1. Telegram Auth (OTP Mangwana) ---
  const handleGetOTP = async () => {
    const phone = document.getElementById('phone').value;
    const apiId = document.getElementById('apiId').value;
    const apiHash = document.getElementById('apiHash').value;
    if (!phone || !apiId || !apiHash) return alert("Pehle Login Details bhariye!");

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
        setPhoneHash(data.hash);
        setShowOtp(true);
        setStatus("✅ OTP Sent! Telegram check karein.");
      } else { setStatus("❌ Error: " + data.error); }
    } catch (err) { setStatus("❌ Connection failed!"); }
    setLoading(false);
  };

  // --- 2. OTP Verification ---
  const handleVerifyOTP = async () => {
    const otp = document.getElementById('otp').value;
    const phone = document.getElementById('phone').value;
    const apiId = document.getElementById('apiId').value;
    const apiHash = document.getElementById('apiHash').value;

    setLoading(true);
    setStatus("Verifying...");
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verifyCode', phone, otp, hash: phoneHash, apiId, apiHash })
      });
      const data = await res.json();
      if (data.success) {
        setStatus("🚀 LOGIN SUCCESS! Session saved.");
        setShowOtp(false);
      } else { setStatus("❌ Error: " + data.error); }
    } catch (err) { setStatus("❌ Failed!"); }
    setLoading(false);
  };

  // --- 3. Advanced Batch Automation ---
  const handleAutomation = async () => {
    const list = document.getElementById('contentList').value.split('\n');
    const target = document.getElementById('target').value;
    const apiId = document.getElementById('apiId').value;
    const apiHash = document.getElementById('apiHash').value;
    const delay = parseFloat(document.getElementById('delay').value) || 3;

    if (!target || !apiId || !apiHash) return alert("Target aur API Details bhariye!");

    setLoading(true);
    setStatus(`🚀 Starting Batch ${sendType.toUpperCase()}...`);

    for (let i = 0; i < list.length; i++) {
      if (!list[i].trim()) continue;

      let body = { type: sendType, target, apiId, apiHash };

      if (sendType === 'poll') {
        // Format: Question|Opt1,Opt2,Opt3|CorrectIndex
        const [q, opts, correct] = list[i].split('|');
        body.question = q;
        body.options = opts ? opts.split(',') : [];
        body.correctIndex = parseInt(correct) || 0;
      } else {
        // HTML Message format
        body.message = list[i];
      }

      await fetch('/api/send-poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const p = Math.round(((i + 1) / list.length) * 100);
      setProgress(p);
      setStatus(`✅ Sent ${i + 1}/${list.length}`);
      
      // User Defined Delay
      await new Promise(r => setTimeout(r, delay * 1000));
    }

    setStatus("🎯 Task Finished Successfully!");
    setLoading(false);
    setProgress(0);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '15px', maxWidth: '500px', margin: 'auto', background: '#f0f2f5', minHeight: '100vh' }}>
      <h2 style={{ textAlign: 'center', color: '#0088cc' }}>BaseKey Telegram Panel</h2>

      {/* Login Card */}
      <div style={cardStyle}>
        <p style={{fontWeight: 'bold', margin: '0 0 10px 0'}}>🔑 Step 1: Authentication</p>
        <input id="apiId" placeholder="API ID" style={inputStyle} />
        <input id="apiHash" placeholder="API Hash" style={inputStyle} />
        <input id="phone" placeholder="+91XXXXXXXXXX" style={inputStyle} />
        <button onClick={handleGetOTP} disabled={loading} style={btnStyle}>Get OTP Code</button>
        {showOtp && (
          <div style={{marginTop: '10px'}}>
            <input id="otp" placeholder="Enter 5-digit OTP" style={inputStyle} />
            <button onClick={handleVerifyOTP} style={{...btnStyle, background: '#28a745'}}>Verify & Save</button>
          </div>
        )}
      </div>

      {/* Automation Card */}
      <div style={cardStyle}>
        <p style={{fontWeight: 'bold', margin: '0 0 10px 0'}}>📤 Step 2: Automation Settings</p>
        
        <label style={{fontSize: '12px'}}>Mode Chunein:</label>
        <select style={inputStyle} onChange={(e) => setSendType(e.target.value)}>
          <option value="poll">📊 Quiz Polls (QuizBot Mode)</option>
          <option value="text">✉️ Formatted HTML Messages</option>
        </select>

        <label style={{fontSize: '12px'}}>Delay (Seconds):</label>
        <input id="delay" type="number" defaultValue="3.5" style={inputStyle} />

        <input id="target" placeholder="@username ya Chat ID" style={inputStyle} />
        
        <textarea 
          id="contentList" 
          rows="6" 
          placeholder={sendType === 'poll' ? "Q|A,B,C|1 (Index 1=B is correct)" : "<b>HTML tags allowed here</b>"} 
          style={inputStyle}
        ></textarea>
        
        <button onClick={handleAutomation} disabled={loading} style={{...btnStyle, background: '#0088cc'}}>
          {loading ? "Running..." : "🚀 Start Automation"}
        </button>

        {progress > 0 && (
          <div style={{width: '100%', background: '#ddd', height: '10px', marginTop: '10px', borderRadius: '5px'}}>
            <div style={{width: `${progress}%`, background: '#0088cc', height: '100%', borderRadius: '5px', transition: '0.4s'}}></div>
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontWeight: 'bold', color: '#0088cc' }}>Status: {status}</p>
    </div>
  );
}

const cardStyle = { background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
const inputStyle = { width: '100%', padding: '10px', margin: '5px 0', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '12px', background: '#0088cc', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
          
