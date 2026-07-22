import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getDb } from '@/lib/db';

initializeDatabase();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();

  if (body.type === 'update-section') {
    await db.prepare('UPDATE students SET year_section = ?, updated_at = ? WHERE id = ?').run(body.year_section, new Date().toISOString(), body.studentId);
    return NextResponse.json({ success: true });
  }

  if (body.type === 'scan-qr') {
    const { studentId, studentName, year_section, qrPayload } = body;
    if (!qrPayload) {
      return NextResponse.json({ error: 'No QR payload provided' }, { status: 400 });
    }

    let parsed;
    try {
      parsed = JSON.parse(qrPayload);
    } catch {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 });
    }

    const session = await db.prepare('SELECT * FROM attendance_sessions WHERE session_id = ?').get(parsed.session_id) as any;
    if (!session) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 });
    }

    const now = new Date();
    const manilaTime = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour12: false, hour: '2-digit', minute: '2-digit' }).format(now);
    const expiration = new Date(`${new Date().toISOString().slice(0, 10)}T${session.expiration_time}:00`);
    if (new Date().getTime() > expiration.getTime()) {
      return NextResponse.json({ error: 'QR Code Expired' }, { status: 400 });
    }

    const existing = await db.prepare('SELECT * FROM attendance_records WHERE session_id = ? AND student_id = ?').get(parsed.session_id, studentId) as any;
    if (existing) {
      return NextResponse.json({ error: 'Attendance already recorded for this session' }, { status: 400 });
    }

    const date = now.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' });
    const time = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila' });
    await db.prepare('INSERT INTO attendance_records (session_id, student_id, subject_id, date, time, status, year_section, student_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(parsed.session_id, studentId, session.subject_id, date, time, 'Present', year_section, studentName, now.toISOString());
    return NextResponse.json({ success: true, message: 'Attendance recorded successfully' });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
