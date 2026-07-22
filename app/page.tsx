'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #dbeafe, #f8fafc)' }}>
      <div className="card" style={{ width: 420, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 12 }}>QR Attendance Management System</h1>
        <p style={{ color: '#475569', marginBottom: 24 }}>Choose your access point to continue.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => router.push('/login')}>Login</button>
          <button className="btn btn-secondary" onClick={() => router.push('/signup')}>Signup</button>
        </div>
      </div>
    </main>
  );
}
