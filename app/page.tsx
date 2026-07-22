'use client';

import LoginPage from './login/page';

export default function HomePage() {
  // Render the same login UI at the root path for parity with /login
  return <LoginPage />;
}
