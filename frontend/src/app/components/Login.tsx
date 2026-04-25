import React, { useState } from 'react';

export default function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('ledger_token', data.access_token);
        onLogin(data.access_token);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
      <div className="bg-surface-container-low p-8 rounded-lg border border-surface-variant max-w-sm w-full">
        <h1 className="font-mono text-xl mb-6 font-bold text-center">Invisible Ledger</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Admin Password"
            className="p-3 bg-surface border border-outline-variant rounded font-mono text-sm focus:outline-none focus:border-primary"
          />
          {error && <div className="text-error font-mono text-xs">{error}</div>}
          <button type="submit" className="bg-primary text-on-primary p-3 rounded font-mono text-sm font-bold mt-2 hover:opacity-90">
            Access Ledger
          </button>
        </form>
      </div>
    </div>
  );
}
