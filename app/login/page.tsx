'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const isTeacherLogin = username.trim().startsWith('@');
    const loginType = isTeacherLogin ? 'teacher-login' : 'student-login';

    try {
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: loginType, username, password }) });
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

      const role = data.user.role || (isTeacherLogin ? 'teacher' : 'student');
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push(role === 'student' ? '/dashboard' : '/teacher');
    } catch {
      setMessage('Unable to reach the server right now.');
    }
  };

  return (
    <main className="login-wrapper">
      <div className="login-card">
        <div className="login-hero">
          <div className="login-hero-icon" aria-hidden>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="1.5" fill="white" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" fill="white" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" fill="white" />
              <path d="M14 14h2v2h-2z" fill="white" />
            </svg>
          </div>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Sign in to the QR Attendance System</p>
        </div>

        <form onSubmit={submit} className="login-form">
          <label className="input-label">Username</label>
          <input className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />

          <label className="input-label">Password</label>
          <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />

          <button className="btn btn-primary login-submit" type="submit">Sign in</button>
        </form>

        {message ? <p className="login-error">{message}</p> : null}

        <div className="login-footer">
          <p>Don't have an account? <a href="/signup">Sign up</a></p>
        </div>
      </div>
    </main>
  );
}
