import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initializeDatabase, getDb } from '@/lib/db';

initializeDatabase();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, username, password, lastname, firstname, middlename } = body;
  const db = getDb();

  if (type === 'student-register') {
    const existing = db.prepare('SELECT * FROM students WHERE username = ?').get(username);
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    const hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    const info = db.prepare('INSERT INTO students (lastname, firstname, middlename, username, password, year_section, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(lastname, firstname, middlename || '', username, hash, '2-A', now, now);
    return NextResponse.json({ success: true, studentId: info.lastInsertRowid });
  }

  if (type === 'student-login') {
    const user = db.prepare('SELECT * FROM students WHERE username = ?').get(username) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
    return NextResponse.json({ success: true, user: { id: user.id, role: 'student', username: user.username, name: `${user.firstname} ${user.lastname}`, year_section: user.year_section } });
  }

  if (type === 'teacher-login') {
    const user = db.prepare('SELECT * FROM teachers WHERE username = ?').get(username) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({ error: 'Invalid teacher credentials' }, { status: 401 });
    }
    return NextResponse.json({ success: true, user: { id: user.id, role: 'teacher', username: user.username, name: user.name } });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
