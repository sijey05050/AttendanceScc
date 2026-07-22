import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { initializeDatabase, getDb } from '@/lib/db';

initializeDatabase();

export async function GET() {
  const db = getDb();
  const students = await db.prepare('SELECT * FROM students').all();
  const subjects = await db.prepare('SELECT * FROM subjects').all();
  const sessions = await db.prepare('SELECT * FROM attendance_sessions ORDER BY created_at DESC').all();
  const records = await db.prepare('SELECT * FROM attendance_records ORDER BY created_at DESC').all();
  return NextResponse.json({ students, subjects, sessions, records });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();

  if (body.type === 'create-session') {
    const subject = await db.prepare('SELECT * FROM subjects WHERE subject_name = ?').get(body.subjectName) as any;
    const sessionId = `${body.subjectName.replace(/\s+/g, '').slice(0, 6).toUpperCase()}-${Date.now()}`;
    const qrToken = `qr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' });
    const expirationTime = new Date(now.getTime() + 5 * 60000).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila' });
    await db.prepare('INSERT INTO attendance_sessions (subject_id, qr_token, session_id, date, expiration_time, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(subject?.id || 1, qrToken, sessionId, date, expirationTime, 'teacher', now.toISOString());
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify({ subject: body.subjectName, session_id: sessionId, date, expires: expirationTime }));
    return NextResponse.json({ success: true, message: 'QR code generated', qrDataUrl, sessionId });
  }

  if (body.type === 'delete-student') {
    await db.prepare('DELETE FROM students WHERE id = ?').run(body.studentId);
    return NextResponse.json({ success: true, message: 'Student deleted' });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
