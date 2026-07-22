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
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: 480 }}>
        <h2>Student Signup</h2>
        <form onSubmit={submit}>
          <input value={lastname} onChange={(e) => setLastname(e.target.value)} placeholder="Last Name" style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 10, border: '1px solid #cbd5e1' }} required />
          <input value={firstname} onChange={(e) => setFirstname(e.target.value)} placeholder="First Name" style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 10, border: '1px solid #cbd5e1' }} required />
          <input value={middlename} onChange={(e) => setMiddlename(e.target.value)} placeholder="Middle Name" style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 10, border: '1px solid #cbd5e1' }} />
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 10, border: '1px solid #cbd5e1' }} required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 10, border: '1px solid #cbd5e1' }} required />
          <button className="btn btn-primary" style={{ width: '100%' }} type="submit">Create account</button>
        </form>
        {message ? <p style={{ marginTop: 12, color: message.includes('created') ? 'green' : 'crimson' }}>{message}</p> : null}
        <p style={{ marginTop: 16 }}><a href="/login" style={{ color: '#2563eb' }}>Go back to login</a></p>
      </div>
    </main>
  );
}
