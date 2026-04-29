import React, { useEffect, useState, useMemo } from 'react';
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
  raw_data: string;
};

export default function DesktopDashboard({ token, onLogout }: { token: string, onLogout: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

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
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
    // Poll every 5s for the "sync" feel
    const interval = setInterval(fetchTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      {/* Sidebar */}
      <aside className="flex flex-col fixed left-0 top-0 h-full py-6 w-64 border-r border-surface-variant bg-surface-container-low/80 backdrop-blur-md z-50">
        <div className="px-6 mb-8 flex flex-col gap-1">
          <span className="font-mono font-black text-xl tracking-tighter">Invisible Ledger</span>
          <span className="font-mono text-xs uppercase tracking-widest text-primary">Technical Minimalist</span>
        </div>
        <nav className="flex flex-col gap-1 px-4 mt-4">
          <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-variant text-primary font-bold border-r-2 border-primary" href="#">
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span className="font-mono text-xs uppercase tracking-widest">Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-tertiary hover:bg-surface-variant/50" href="#">
            <span className="material-symbols-outlined text-lg">history</span>
            <span className="font-mono text-xs uppercase tracking-widest">History</span>
          </a>
        </nav>

        <div className="mt-auto px-4">
          <button onClick={onLogout} className="w-full py-3 px-4 bg-surface-variant/50 rounded-lg hover:bg-surface-variant transition-all flex items-center justify-center gap-2 text-error font-mono text-xs uppercase tracking-widest">
             Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 flex flex-col h-screen overflow-hidden">
        <header className="flex justify-between items-center px-6 h-14 w-full border-b border-surface-variant sticky top-0 z-40 bg-surface/70 backdrop-blur-xl">
          <div className="flex items-center gap-2 bg-surface-container-low rounded px-3 py-1.5 w-64 border border-transparent focus-within:border-primary">
            <span className="material-symbols-outlined text-outline text-sm">search</span>
            <input className="bg-transparent border-none outline-none font-mono text-sm w-full" placeholder="Query ledger..." />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
            <span className="font-mono text-sm text-primary">Syncing</span>
            <span className="material-symbols-outlined text-outline text-sm">sync</span>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden p-4 gap-4">
          <section className="flex-[1.8] flex flex-col gap-4 overflow-y-auto pr-2">
            <div className="grid grid-cols-3 gap-4 shrink-0 mb-4">
              <div className="bg-surface-container-low border border-surface-variant rounded-lg p-4 flex flex-col gap-2">
                <span className="font-mono text-xs text-tertiary uppercase">Total Outflow</span>
                <span className="text-3xl font-bold font-mono text-error">${totalOutflow.toFixed(2)}</span>
              </div>
              <div className="bg-surface-container-low border border-surface-variant rounded-lg p-4 flex flex-col gap-2">
                <span className="font-mono text-xs text-tertiary uppercase">Transactions Processed</span>
                <span className="text-3xl font-bold font-mono text-primary">{transactions.length}</span>
              </div>
              <div className="bg-surface-container-low border border-surface-variant rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden group">
                 <span className="font-mono text-xs text-tertiary uppercase">System Status</span>
                 <div className="flex items-center gap-2 mt-2">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                    <span className="font-mono text-sm text-primary">All systems nominal</span>
                 </div>
              </div>
            </div>

            {/* Chart Section */}
            {chartData.length > 0 && (
              <div className="bg-surface-container-low border border-surface-variant rounded-lg p-4 h-64 mb-4 flex flex-col">
                <span className="font-mono text-xs text-tertiary uppercase mb-4">Flow Overview (Last 7 Days)</span>
                <div className="flex-1 w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-variant)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--color-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-tertiary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--color-surface-container-high)', border: '1px solid var(--color-surface-variant)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-geist-mono)' }}
                      />
                      <Line type="monotone" dataKey="outflow" stroke="var(--color-error)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-error)' }} name="Outflow" />
                      <Line type="monotone" dataKey="inflow" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-primary)' }} name="Inflow" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-surface-container-low border border-surface-variant rounded-lg flex flex-col flex-1 min-h-0">
              <div className="px-4 py-3 border-b border-surface-variant bg-surface/50">
                <span className="font-medium">Transaction Feed</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-container-low z-10 border-b border-surface-variant font-mono text-xs text-tertiary">
                    <tr>
                      <th className="px-4 py-2 font-normal">DATE</th>
                      <th className="px-4 py-2 font-normal">MERCHANT</th>
                      <th className="px-4 py-2 font-normal">CATEGORY</th>
                      <th className="px-4 py-2 font-normal text-right">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-sm divide-y divide-surface-variant/50">
                    {transactions.map(t => (
                      <tr key={t.id} onClick={() => setSelectedTx(t)} className={`hover:bg-surface-variant/30 cursor-pointer transition-colors ${selectedTx?.id === t.id ? 'bg-primary/5 border-l-2 border-primary' : 'border-l-2 border-transparent'}`}>
                        <td className="px-4 py-3 text-tertiary">{new Date(t.timestamp).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                           <div className={`w-8 h-8 rounded border border-surface-variant flex items-center justify-center bg-surface-container-high text-tertiary mr-2`}>
                             <span className="material-symbols-outlined text-[16px]">{t.is_expense ? 'receipt_long' : 'south_west'}</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-on-surface font-medium">{t.merchant}</span>
                             <span className="text-[11px] text-tertiary font-mono">{t.payment_method}</span>
                           </div>
                        </td>
                        <td className="px-4 py-3"><span className="bg-surface-variant/50 px-2 py-0.5 rounded text-[11px] text-tertiary border border-surface-variant">{t.category}</span></td>
                        <td className={`px-4 py-3 text-right ${t.is_expense ? 'text-on-surface' : 'text-primary'}`}>
                          {t.is_expense ? '-' : '+'}${t.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && !loading && (
                      <tr><td colSpan={4} className="text-center py-4 text-tertiary">No transactions found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Right Panel: Parser Inspection */}
          {selectedTx && (
            <section className="flex-[1.2] flex flex-col overflow-hidden bg-surface-container-low border border-surface-variant rounded-lg">
              <div className="px-4 py-3 border-b border-surface-variant flex justify-between items-center bg-surface/50">
                <span className="font-mono text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">terminal</span>
                  PARSER INSPECTION
                </span>
                <button onClick={() => setSelectedTx(null)} className="text-tertiary hover:text-on-surface">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs text-tertiary uppercase">Raw Telemetry String</span>
                  <div className="bg-surface-container-high border border-outline-variant/50 rounded p-3 font-mono text-[13px] text-tertiary break-all">
                    {selectedTx.raw_data || 'No raw data available'}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <span className="font-mono text-xs text-tertiary uppercase">Structured Output (JSON)</span>
                  <div className="bg-background text-on-background rounded-lg border border-surface-variant p-4 flex-1 overflow-auto font-mono text-[13px] leading-relaxed">
                    <pre>
{JSON.stringify({
  id: selectedTx.id,
  timestamp: selectedTx.timestamp,
  merchant: selectedTx.merchant,
  category: selectedTx.category,
  payment_method: selectedTx.payment_method,
  amount: selectedTx.amount,
  currency: selectedTx.currency,
  is_expense: selectedTx.is_expense,
  source: selectedTx.source
}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
