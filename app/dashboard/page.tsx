'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [user, setUser] = useState<any>(null);
  const [section, setSection] = useState('2-A');
  const [message, setMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const role = localStorage.getItem('role');
    if (!stored || role !== 'student') {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setSection(parsed.year_section || '2-A');
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const readerElement = document.getElementById('reader');
    if (!readerElement) return;

    try {
      scannerRef.current = new Html5Qrcode('reader');
    } catch {
      setMessage('Unable to initialize the QR scanner.');
    }

    return () => {
      scannerRef.current?.stop().catch(() => undefined);
      scannerRef.current = null;
    };
  }, [user]);

  const updateSection = async () => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const parsed = JSON.parse(stored);
    const response = await fetch('/api/student', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'update-section', studentId: parsed.id, year_section: section }) });
    const data = await response.json();
    if (response.ok) {
      const updated = { ...parsed, year_section: section };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setMessage('Year and section updated');
    }
  };

  const logout = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    try {
      router.push('/login');
    } catch {
      window.location.href = '/login';
    }
  };

  const scanQr = async () => {
    if (!scannerRef.current) return;
    setScanning(true);
    setMessage('');
    try {
      await scannerRef.current.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 } }, async (decodedText) => {
        const response = await fetch('/api/student', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'scan-qr', studentId: user?.id, studentName: user?.name, year_section: section, qrPayload: decodedText }) });
        const data = await response.json();
        await scannerRef.current?.stop();
        setScanning(false);
        if (!response.ok) {
          setMessage(data.error || 'Scan failed');
          return;
        }
        setResult(data.message || 'Attendance recorded');
        setMessage('Attendance recorded successfully');
      }, () => undefined);
    } catch {
      setScanning(false);
      setMessage('Unable to start the camera.');
    }
  };

  if (!user) return <div className="container">Loading...</div>;

  return (
    <main className="container student-dashboard">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-subtitle">Student Portal</p>
          <h1>Welcome, {user.name}</h1>
          <p className="dashboard-description">Your attendance and section controls.</p>
        </div>
        <button className="btn btn-secondary logout-button" onClick={logout}>Logout</button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <p>Current Section</p>
          <h2>{user.year_section}</h2>
        </div>
        <div className="stat-card">
          <p>Scan Status</p>
          <h2>{result ? 'Ready' : 'Idle'}</h2>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="card student-panel">
          <h3>Year & Section</h3>
          <select value={section} onChange={(e) => setSection(e.target.value)} className="input-field">
            {['2-A','2-B','3-A','3-B','4-A','4-B'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="btn btn-primary" onClick={updateSection}>Save section</button>
        </section>

        <section className="card student-panel">
          <h3>Attendance</h3>
          <p>Scan a teacher-generated QR code to mark attendance.</p>
          <button className="btn btn-primary" onClick={scanQr} disabled={scanning}>{scanning ? 'Scanning...' : 'Start QR Scanner'}</button>
          <div id="reader" className="scanner-box" />
          {message ? <p className="field-note">{message}</p> : null}
        </section>
      </div>
    </main>
  );
}
