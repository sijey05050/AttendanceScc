'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [lastname, setLastname] = useState('');
  const [firstname, setFirstname] = useState('');
  const [middlename, setMiddlename] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'student-register', lastname, firstname, middlename, username, password }) });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Signup failed');
      return;
    }
    setMessage('Account created. You can now log in.');
    setTimeout(() => router.push('/login'), 800);
  };

  return (
    <main className="login-wrapper">
      <div className="login-card">
        <div className="login-hero">
          <div className="login-hero-icon" aria-hidden>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v3h-2V7h-4v2h-2V6a2 2 0 0 0-2-2H8V4a2 2 0 0 1 2-2h2z" fill="white" />
            </svg>
          </div>
          <h1 className="login-title">Create student account</h1>
          <p className="login-subtitle">Fill in your details to get started</p>
        </div>

        <form onSubmit={submit} className="signup-form">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <label className="input-label">Last name</label>
              <input className="input-field" value={lastname} onChange={(e) => setLastname(e.target.value)} placeholder="" required />
            </div>
            <div>
              <label className="input-label">First name</label>
              <input className="input-field" value={firstname} onChange={(e) => setFirstname(e.target.value)} placeholder="" required />
            </div>
            <div>
              <label className="input-label">Middle name</label>
              <input className="input-field" value={middlename} onChange={(e) => setMiddlename(e.target.value)} placeholder="" />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="input-label">Username</label>
            <input className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12, marginTop: 12 }}>
            <div>
              <label className="input-label">Password</label>
              <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="" required />
            </div>
            <div>
              <label className="input-label">Year & Section</label>
              <select className="input-field" defaultValue="2-A">
                <option value="2-A">2-A</option>
                <option value="2-B">2-B</option>
                <option value="3-A">3-A</option>
                <option value="3-B">3-B</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary login-submit" style={{ marginTop: 16 }} type="submit">Create account</button>
        </form>

        {message ? <p className="login-error">{message}</p> : null}

        <div className="login-footer" style={{ marginTop: 12 }}>
          <p>Already have an account? <a href="/login">Back to login</a></p>
        </div>
      </div>
    </main>
  );
}
