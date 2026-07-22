'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: '📊' },
  { label: 'Students', href: '/teacher/students', icon: '👥' },
  { label: 'Attendance', href: '/teacher/attendance', icon: '📷' },
  { label: 'Records', href: '/teacher/records', icon: '🗂️' },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    if (!storedUser || storedRole !== 'teacher') {
      router.push('/login');
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      router.push('/login');
    }
  }, [router]);

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

  if (!user) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="teacher-shell">
      <aside className="teacher-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">TA</div>
          <div>
            <p className="brand-title">Teacher Portal</p>
            <p className="brand-subtitle">Attendance app</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`sidebar-link ${active ? 'active' : ''}`}>
                <span className="link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-user">Signed in as</p>
          <p className="sidebar-user-name">{user.name}</p>
          <button className="btn btn-secondary logout-button" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="teacher-main">
        <header className="teacher-topbar">
          <div>
            <p className="page-eyebrow">Teacher Dashboard</p>
            <h1 className="page-title">Welcome back, {user.name}</h1>
          </div>
        </header>

        <div className="teacher-content">{children}</div>
      </main>
    </div>
  );
}
