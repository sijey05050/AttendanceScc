'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<string[]>(['2-A','2-B','3-A','3-B','4-A','4-B']);
  const [selectedSection, setSelectedSection] = useState('2-A');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const role = localStorage.getItem('role');
    if (!stored || role !== 'teacher') {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(stored);
    setUser(parsed);
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const response = await fetch('/api/teacher');
      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      setStudents(data.students || []);
      setSubjects(data.subjects || []);
    } catch {
      setMessage('Unable to load teacher data.');
    }
  };

  const createSession = async (subjectName: string) => {
    setSelectedSubject(subjectName);
    const response = await fetch('/api/teacher', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'create-session', subjectName }) });
    const data = await response.json();
    setMessage(data.message || 'Session created');
  };

  const deleteStudent = async (id: number) => {
    const response = await fetch('/api/teacher', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'delete-student', studentId: id }) });
    const data = await response.json();
    if (response.ok) {
      setStudents((current) => current.filter((item) => item.id !== id));
      setMessage(data.message || 'Student deleted');
    }
  };

  if (!user) return <div className="container">Loading...</div>;

  return (
    <main className="container">
      <div className="card" style={{ marginBottom: 16 }}>
        <h2>Teacher Dashboard</h2>
        <p>Welcome, {user.name}</p>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Sections</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sections.map((section) => <button key={section} className="btn btn-secondary" onClick={() => setSelectedSection(section)}>{section}</button>)}
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Subjects</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {subjects.map((subject) => <button key={subject.id} className="btn btn-primary" onClick={() => createSession(subject.subject_name)}>{subject.subject_name}</button>)}
        </div>
        {selectedSubject ? <p style={{ marginTop: 12 }}>Selected: {selectedSubject}</p> : null}
        {message ? <p style={{ marginTop: 12, color: 'green' }}>{message}</p> : null}
      </div>
      <div className="card">
        <h3>Students in {selectedSection}</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Student ID</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Username</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Section</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.filter((item) => item.year_section === selectedSection).map((student) => (
              <tr key={student.id}>
                <td style={{ padding: 8 }}>{student.id}</td>
                <td style={{ padding: 8 }}>{student.firstname} {student.lastname}</td>
                <td style={{ padding: 8 }}>{student.username}</td>
                <td style={{ padding: 8 }}>{student.year_section}</td>
                <td style={{ padding: 8 }}><button className="btn btn-secondary" onClick={() => deleteStudent(student.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
