'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sections, setSections] = useState<string[]>(['2-A','2-B','3-A','3-B','4-A','4-B']);
  const [selectedSection, setSelectedSection] = useState('2-A');
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Students' | 'Attendance' | 'Records'>('Dashboard');
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
      setSessions(data.sessions || []);
      setRecords(data.records || []);
      setTotalSessions((data.sessions || []).length);
      setTotalRecords((data.records || []).length);
    } catch {
      setMessage('Unable to load teacher data.');
    }
  };

  const createSession = async (subjectName: string) => {
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
      router.replace('/login');
    } catch {
      window.location.assign('/login');
    }
  };

  if (!user) return <div className="container">Loading...</div>;

  return (
    <main className="teacher-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-icon">QR</div>
            <div>
              <p className="brand-label">QR Attendance</p>
              <p className="brand-role">Teacher Portal</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {['Dashboard', 'Students', 'Attendance', 'Records'].map((tab) => (
              <button
                key={tab}
                className={`nav-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab as any)}
              >
                <span>{tab}</span>
              </button>
            ))}
          </nav>
        </div>

        <button className="btn btn-secondary logout-button sidebar-logout" onClick={logout}>Logout</button>
      </aside>

      <section className="teacher-content">
        <div className="top-bar">
          <div>
            <p className="dashboard-subtitle">Teacher Portal</p>
            <h1>Welcome, {user.name}</h1>
            <p className="dashboard-description">Manage students, sessions, attendance and reports from one place.</p>
          </div>
          <div className="top-actions">
            <button className="btn btn-primary" onClick={() => setActiveTab('Attendance')}>Create session</button>
          </div>
        </div>

        {message ? <div className="status-banner">{message}</div> : null}

        {activeTab === 'Dashboard' && (
          <div className="card-grid">
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
        )}

        {activeTab === 'Students' && (
          <div className="card students-panel">
            <div className="section-panel-header">
              <h3>Students in {selectedSection}</h3>
              <div className="section-buttons">
                {sections.map((section) => (
                  <button
                    key={section}
                    className={selectedSection === section ? 'btn btn-primary btn-pill' : 'btn btn-secondary btn-pill'}
                    onClick={() => setSelectedSection(section)}
                  >
                    {section}
                  </button>
                ))}
              </div>
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
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => deleteStudent(student.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Attendance' && (
          <div className="card subject-panel">
            <div className="section-panel-header">
              <h3>Attendance Sessions</h3>
            </div>
            <div className="subject-grid">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  className="subject-card"
                  onClick={() => createSession(subject.subject_name)}
                >
                  {subject.subject_name}
                </button>
              ))}
            </div>
            <div className="session-table-wrapper">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Expires</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.session_id}</td>
                      <td>{session.subject_id || 'Unknown'}</td>
                      <td>{session.date}</td>
                      <td>{session.expiration_time}</td>
                      <td>{new Date(session.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Records' && (
          <div className="card records-grid">
            <div className="stat-card">
              <p>Attendance Records</p>
              <h2>{totalRecords}</h2>
            </div>
            <div className="stat-card">
              <p>Sessions Created</p>
              <h2>{totalSessions}</h2>
            </div>
            <div className="card records-table-panel">
              <h3>Recent attendance</h3>
              <div className="students-table-wrapper">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Section</th>
                      <th>Subject</th>
                      <th>Session</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.slice(0, 20).map((record) => (
                      <tr key={record.id}>
                        <td>{record.student_name}</td>
                        <td>{record.year_section}</td>
                        <td>{record.subject_id || 'Unknown'}</td>
                        <td>{record.session_id}</td>
                        <td>{record.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
