import React, { useEffect, useState, useMemo } from 'react';
import SwipeToDelete from './SwipeToDelete';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Transaction = {
  id: number;
  timestamp: string;
  source: string;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  payment_method: string;
  is_expense: boolean;
};

export default function MobileDashboard({ token, onLogout }: { token: string, onLogout: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/transactions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.status === 401) {
          onLogout();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (e) {
        console.error("Failed to fetch", e);
      }
    };
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  const deleteTransaction = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  const totalOutflow = transactions
    .filter(t => t.is_expense)
    .reduce((sum, t) => sum + t.amount, 0);

  // Group transactions by day for the chart
  const chartData = useMemo(() => {
    const grouped = transactions.reduce((acc, t) => {
      const date = new Date(t.timestamp).toLocaleDateString();
      if (!acc[date]) acc[date] = { date, outflow: 0, inflow: 0 };
      if (t.is_expense) {
        acc[date].outflow += t.amount;
      } else {
        acc[date].inflow += t.amount;
      }
      return acc;
    }, {} as Record<string, { date: string, outflow: number, inflow: number }>);

    // Sort by date and take the last 7 days
    return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);
  }, [transactions]);

  return (
    <div className="bg-background text-on-background flex flex-col min-h-screen pb-20">
      <header className="h-14 w-full bg-surface/70 backdrop-blur-xl sticky top-0 z-40 flex justify-between items-center px-4 border-b border-surface-variant">
        <span className="font-bold tracking-tight">Invisible Ledger</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-primary uppercase tracking-widest">Syncing</span>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6">
        <section className="bg-surface-container-low rounded-lg p-6 flex flex-col gap-2 border border-surface-variant">
          <h2 className="font-mono text-xs text-tertiary uppercase tracking-widest">Total Outflow</h2>
          <div className="text-4xl font-bold font-mono tracking-tighter text-error">
            ${totalOutflow.toFixed(2)}
          </div>
        </section>

        {/* Chart Section */}
        {chartData.length > 0 && (
          <section className="bg-surface-container-low rounded-lg p-4 flex flex-col border border-surface-variant h-48">
             <h3 className="font-mono text-xs text-tertiary uppercase tracking-widest mb-2">Flow (7 Days)</h3>
             <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <XAxis dataKey="date" stroke="var(--color-tertiary)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v.split('/')[1] + '/' + v.split('/')[0]} />
                    <YAxis stroke="var(--color-tertiary)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value > 1000 ? (value/1000).toFixed(1) + 'k' : value}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--color-surface-container-high)', border: '1px solid var(--color-surface-variant)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-geist-mono)', fontSize: '12px' }}
                      labelStyle={{ color: 'var(--color-tertiary)', fontSize: '10px' }}
                    />
                    <Line type="monotone" dataKey="outflow" stroke="var(--color-error)" strokeWidth={2} dot={false} name="Outflow" />
                    <Line type="monotone" dataKey="inflow" stroke="var(--color-primary)" strokeWidth={2} dot={false} name="Inflow" />
                  </LineChart>
                </ResponsiveContainer>
             </div>
          </section>
        )}

        <section className="space-y-4">
          <h3 className="font-mono text-xs text-tertiary uppercase tracking-widest">Transaction Feed</h3>

          <div className="flex flex-col divide-y divide-surface-variant border-y border-surface-variant">
            {transactions.map(t => (
              <SwipeToDelete key={t.id} onDelete={() => deleteTransaction(t.id)}>
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 py-3 items-center px-2 hover:bg-surface-container-low transition-colors">
                  <div className="w-10 h-10 rounded border border-surface-variant bg-surface-container-high flex items-center justify-center text-on-surface">
                    <span className="material-symbols-outlined text-[20px]">{t.is_expense ? 'receipt_long' : 'south_west'}</span>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-on-surface">{t.merchant}</div>
                    <div className="font-mono text-xs text-tertiary mt-1 flex gap-2">
                      <span className="bg-surface-variant/50 px-1.5 py-0.5 rounded text-[10px] border border-surface-variant">{t.category}</span>
                      <span>• {t.payment_method}</span>
                    </div>
                  </div>
                  <div className={`font-mono text-sm text-right font-bold ${t.is_expense ? 'text-on-surface' : 'text-primary'}`}>
                    {t.is_expense ? '-' : '+'}${t.amount.toFixed(2)}
                  </div>
                </div>
              </SwipeToDelete>
            ))}
             {transactions.length === 0 && (
                <div className="text-center py-4 text-tertiary font-mono text-sm">No transactions found.</div>
            )}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 w-full bg-surface/90 backdrop-blur-md border-t border-surface-variant pb-safe pt-2 px-6 flex justify-around items-center z-50">
        <button className="flex flex-col items-center gap-1 p-2 text-primary">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-mono text-[10px]">Dashboard</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 text-tertiary">
          <span className="material-symbols-outlined">history</span>
          <span className="font-mono text-[10px]">History</span>
        </button>
        <button onClick={onLogout} className="flex flex-col items-center gap-1 p-2 text-error">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-mono text-[10px]">Logout</span>
        </button>
      </nav>
    </div>
  );
}
