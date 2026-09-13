import React, { useEffect, useState } from 'react';
import { AdminAPI } from '../api/client';

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_PICKED_UP', 'DELIVERED', 'CANCELLED'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');

  async function load() {
    const data = await AdminAPI.orders(status || undefined);
    setOrders(data);
  }

  useEffect(() => { load(); }, [status]);

  return (
    <div>
      <h1>Orders</h1>
      <p className="page-sub">Platform-wide view, most recent first.</p>

      <div className="card" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 13, color: 'var(--muted)' }}>Filter by status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 220 }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All'}</option>)}
        </select>
      </div>

      <div className="card">
        {orders.map((o) => (
          <div className="row" key={o.id}>
            <div>
              <strong>#{o.code}</strong> — {o.vendor?.name}
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {o.customer?.fullName} · {o.customer?.phone}
              </div>
            </div>
            <span className="pill">{o.status.replace(/_/g, ' ')}</span>
            <div style={{ fontWeight: 700 }}>EGP {o.total}</div>
          </div>
        ))}
        {orders.length === 0 && <p style={{ color: 'var(--muted)' }}>No orders match this filter.</p>}
      </div>
    </div>
  );
}
