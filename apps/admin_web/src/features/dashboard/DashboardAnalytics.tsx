import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, ShoppingCart, Package, CreditCard } from 'lucide-react';
import clsx from 'clsx';

interface DashboardAnalyticsProps {
  salesVsExpenses: unknown[];
  paymentBreakdown: {
    cash: number;
    bkash: number;
    credit: number;
  };
  totalRevenue: number;
  lowStockCount: number;
  isCompact?: boolean;
}

const COLORS = ['#10b981', '#ec4899', '#f59e0b']; // success, pink (bkash), warning

export function DashboardAnalytics({
  salesVsExpenses,
  paymentBreakdown,
  totalRevenue,
  lowStockCount,
  isCompact = false,
}: DashboardAnalyticsProps) {
  const pieData = [
    { name: 'Cash', value: paymentBreakdown.cash },
    { name: 'bKash', value: paymentBreakdown.bkash },
    { name: 'Credit', value: paymentBreakdown.credit },
  ].filter(d => d.value > 0);

  return (
    <div className={clsx("grid grid-cols-1 lg:grid-cols-2 gap-6", isCompact ? "mt-4" : "mt-8")}>
      {/* 1. Revenue Trend (Glassmorphic Card) */}
      <div className="bg-surface-default/40 backdrop-blur-md border border-border-default rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} className="text-primary-default" />
              Revenue & Expense Trend
            </h3>
            <p className="text-xs text-text-secondary mt-1">Daily operational performance (Last 14 days)</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-text-primary tracking-tighter">
              ৳{totalRevenue.toLocaleString()}
            </span>
            <div className="text-[10px] font-bold text-success uppercase tracking-widest">Total 14d Net</div>
          </div>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesVsExpenses}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                hide 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSales)" 
                animationDuration={1500}
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1} 
                fill="url(#colorExpenses)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Right Column: Mix & Health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Payment Mix (Glassmorphic) */}
        <div className="bg-surface-default/40 backdrop-blur-md border border-border-default rounded-xl p-5 shadow-sm">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <CreditCard size={14} className="text-pink-500" />
            Payment Mix
          </h3>
          <div className="h-[140px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-text-primary">৳{fmtShort(totalRevenue)}</span>
              <span className="text-[8px] font-bold text-text-muted uppercase">Revenue</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs font-bold text-text-secondary">{d.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-text-primary">
                  {Math.round((d.value / (paymentBreakdown.cash + paymentBreakdown.bkash + paymentBreakdown.credit)) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Health & Quick Stats */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface-default/40 backdrop-blur-md border border-border-default rounded-xl p-5 shadow-sm flex-1 flex flex-col justify-center text-center group hover:bg-warning-subtle/20 transition-colors">
            <div className="w-10 h-10 bg-warning-subtle text-warning-dark rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Package size={20} />
            </div>
            <span className="text-3xl font-black text-text-primary tracking-tighter">{lowStockCount}</span>
            <span className="text-[10px] font-bold text-warning-dark uppercase tracking-widest mt-1">Critical SKUs</span>
            <p className="text-[9px] text-text-muted mt-2">Requires immediate procurement</p>
          </div>

          <div className="bg-surface-default/40 backdrop-blur-md border border-border-default rounded-xl p-5 shadow-sm flex-1 flex flex-col justify-center text-center group hover:bg-success-subtle/20 transition-colors">
            <div className="w-10 h-10 bg-success-subtle text-success-dark rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <ShoppingCart size={20} />
            </div>
            <span className="text-3xl font-black text-text-primary tracking-tighter">84%</span>
            <span className="text-[10px] font-bold text-success-dark uppercase tracking-widest mt-1">Sync Health</span>
            <p className="text-[9px] text-text-muted mt-2">All terminals currently connected</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtShort(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}
