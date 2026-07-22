'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
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
      setTotalSessions(data.total_sessions || 0);
      setTotalRecords(data.total_records || 0);
    } catch {
      setMessage('Unable to load teacher data.');
    }
  };

  const createSession = async (subjectName: string) => {
    setSelectedSubject(subjectName);
    const response = await fetch('/api/teacher', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'create-session', subjectName }) });
    const data = await response.json();
    setMessage(data.message || 'Session created');
    loadData();
  };

  const deleteStudent = async (id: number) => {
    const response = await fetch('/api/teacher', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'delete-student', studentId: id }) });
    const data = await response.json();
    if (response.ok) {
      setStudents((current) => current.filter((item) => item.id !== id));
      setMessage(data.message || 'Student deleted');
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

  if (!user) return <div className="container">Loading...</div>;

  return (
    <main className="container dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-subtitle">Teacher Portal</p>
          <h1>Welcome, {user.name}</h1>
          <p className="dashboard-description">Overview of the attendance system.</p>
        </div>
        <button className="btn btn-secondary logout-button" onClick={logout}>Logout</button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <p>Total Students</p>
          <h2>{students.length}</h2>
        </div>
        <div className="stat-card">
          <p>Sessions Created</p>
          <h2>{totalSessions}</h2>
        </div>
        <div className="stat-card">
          <p>Attendance Records</p>
          <h2>{totalRecords}</h2>
        </div>
      </div>

      {message ? <div className="status-banner">{message}</div> : null}

      <div className="dashboard-grid">
        <section className="card section-panel">
          <div className="section-panel-header">
            <h3>Sections</h3>
          </div>
          <div className="section-buttons">
            {sections.map((section) => (
              <button key={section} className={selectedSection === section ? 'btn btn-primary btn-pill' : 'btn btn-secondary btn-pill'} onClick={() => setSelectedSection(section)}>{section}</button>
            ))}
          </div>
        </section>

        <section className="card subject-panel">
          <div className="section-panel-header">
            <h3>Subjects</h3>
          </div>
          <div className="subject-grid">
            {subjects.map((subject) => (
              <button key={subject.id} className="subject-card" onClick={() => createSession(subject.subject_name)}>{subject.subject_name}</button>
            ))}
          </div>
        </section>
      </div>

      <div className="card students-panel">
        <div className="section-panel-header">
          <h3>Students in {selectedSection}</h3>
        </div>
        <div className="students-table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Section</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.filter((item) => item.year_section === selectedSection).map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.firstname} {student.lastname}</td>
                  <td>{student.username}</td>
                  <td>{student.year_section}</td>
                  <td><button className="btn btn-secondary btn-sm" onClick={() => deleteStudent(student.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
