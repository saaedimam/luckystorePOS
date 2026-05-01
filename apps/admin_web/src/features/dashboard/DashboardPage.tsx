import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { DollarSign, AlertTriangle, Users, Package, TrendingUp } from 'lucide-react';
import { SkeletonCard, ErrorState } from '../../components/PageState';
import { useRealtimeSubscription } from '../../hooks/useRealtime';
import { useNotify } from '../../components/Notification';
import type { ReactNode } from 'react';

export function DashboardPage() {
  const { storeId } = useAuth();
  const { notify } = useNotify();

  // Realtime: show toast when a new sale is inserted on another device
  useRealtimeSubscription({
    table: 'sales',
    event: 'INSERT',
    filter: storeId ? `store_id=eq.${storeId}` : undefined,
    invalidateKeys: [['dashboard-stats', storeId], ['low-stock', storeId]],
    onEvent: () => {
      notify('New sale recorded on another device', 'success');
    },
  });

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', storeId],
    queryFn: () => api.dashboard.getStats(storeId),
  });
  const lowStockQuery = useQuery({
    queryKey: ['low-stock', storeId],
    queryFn: () => api.dashboard.getLowStock(storeId),
  });

  const stats = statsQuery.data;
  const lowStock = lowStockQuery.data;
  const isLoading = statsQuery.isLoading;
  const isError = statsQuery.isError;

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <header style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ width: '200px', height: '28px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: '260px', height: '18px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease-in-out infinite', marginTop: 'var(--space-2)' }} />
        </header>
        <div className="dashboard-grid">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <section style={{ marginTop: 'var(--space-12)' }}>
          <div style={{ width: '160px', height: '22px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: 'var(--space-6)' }} />
          <div className="card" style={{ height: '200px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.3 }} />
        </section>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="dashboard-container">
        <ErrorState message="Failed to load dashboard data." onRetry={() => { statsQuery.refetch(); lowStockQuery.refetch(); }} />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--text-main)' }}>Welcome {stats?.user?.name || 'Mohammed'}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Here's what's happening today.</p>
      </header>

      <div className="dashboard-grid">
        <StatCard
          title="Today Sales"
          value={`৳${stats?.total_sales || '0.00'}`}
          icon={<DollarSign color="var(--color-success)" />}
        />
        <StatCard
          title="Low Stock"
          value={lowStock?.length || 0}
          icon={<AlertTriangle color="var(--color-warning)" />}
          badge={lowStock?.length > 0 ? 'Action Needed' : ''}
        />
        <StatCard
          title="Open Sessions"
          value={stats?.open_sessions || 0}
          icon={<Users color="var(--color-primary)" />}
        />
        <StatCard
          title="Products"
          value={stats?.total_products || 0}
          icon={<Package color="var(--color-secondary)" />}
        />
      </div>

      <section style={{ marginTop: 'var(--space-12)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', marginBottom: 'var(--space-6)' }}>
          Top Products Today
        </h2>
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: 'var(--space-3)' }}>Product</th>
                <th style={{ padding: 'var(--space-3)' }}>Qty Sold</th>
                <th style={{ padding: 'var(--space-3)' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {/* Define product shape for top_products */}
              {stats?.top_products?.map((p: DashboardProduct) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 'var(--space-3)' }}>{p.name}</td>
                  <td style={{ padding: 'var(--space-3)' }}>{p.qty}</td>
                  <td style={{ padding: 'var(--space-3)' }}>${p.revenue}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={3} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No sales data yet today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  title: string;
  /**
   * Value can be a formatted string (e.g., "৳123.45") or a number.
   */
  value: string | number;
  icon: ReactNode;
  badge?: string;
}

// Define product type for top products list
interface DashboardProduct {
  id: string | number;
  name: string;
  qty: number;
  revenue: number;
}

function StatCard({ title, value, icon, badge }: StatCardProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--text-muted)' }}>{title}</span>
        {icon}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700' }}>{value}</span>
        {badge && (
          <span style={{
            fontSize: 'var(--font-size-xs)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            color: 'var(--color-warning)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: '600'
          }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
