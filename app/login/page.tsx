'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: role === 'student' ? 'student-login' : 'teacher-login', username, password }) });
      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setMessage(data.error || 'Login failed');
        return;
      }

      if (!data.user) {
        setMessage('Login response was invalid.');
        return;
      }

      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push(role === 'student' ? '/dashboard' : '/teacher');
    } catch {
      setMessage('Unable to reach the server right now.');
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: 420 }}>
        <h2>Login</h2>
        <p style={{ color: '#64748b' }}>Access the system as a student or teacher.</p>
        <select value={role} onChange={(e) => setRole(e.target.value as 'student' | 'teacher')} style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 10, border: '1px solid #cbd5e1' }}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        <form onSubmit={submit}>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 10, border: '1px solid #cbd5e1' }} required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 10, border: '1px solid #cbd5e1' }} required />
          <button className="btn btn-primary" style={{ width: '100%' }} type="submit">Login</button>
        </form>
        {message ? <p style={{ marginTop: 12, color: 'crimson' }}>{message}</p> : null}
        <p style={{ marginTop: 16 }}><a href="/signup" style={{ color: '#2563eb' }}>Need an account? Sign up</a></p>
        <p style={{ marginTop: 8 }}><a href="/" style={{ color: '#0f766e' }}>Go back home</a></p>
      </div>
    </main>
  );
}
