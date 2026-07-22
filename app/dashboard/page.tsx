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
    <main className="container">
      <div className="card" style={{ marginBottom: 16 }}>
        <h2>Student Dashboard</h2>
        <p>Welcome, {user.name}</p>
        <p>Selected Year & Section: <strong>{user.year_section}</strong></p>
      </div>
      <div className="grid grid-2">
        <div className="card">
          <h3>Year & Section</h3>
          <select value={section} onChange={(e) => setSection(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, marginBottom: 12, border: '1px solid #cbd5e1' }}>
            {['2-A','2-B','3-A','3-B','4-A','4-B'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="btn btn-primary" onClick={updateSection}>Save section</button>
          {message ? <p style={{ marginTop: 12, color: 'green' }}>{message}</p> : null}
        </div>
        <div className="card">
          <h3>Attendance</h3>
          <p>Scan a teacher-generated QR code to mark attendance.</p>
          <button className="btn btn-primary" onClick={scanQr} disabled={scanning}>{scanning ? 'Scanning...' : 'Start QR Scanner'}</button>
          <div id="reader" style={{ width: '100%', maxWidth: 320, marginTop: 12 }} />
          {result ? <p style={{ marginTop: 12 }}>{result}</p> : null}
        </div>
      </div>
    </main>
  );
}
