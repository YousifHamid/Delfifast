import React, { useEffect, useState } from 'react';
import { VendorPanelAPI } from '../api/client';

const NEXT_STATUS = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'RIDER_PICKED_UP',
  RIDER_PICKED_UP: 'DELIVERED',
};
const NEXT_LABEL = {
  PENDING: 'Confirm order',
  CONFIRMED: 'Start preparing',
  PREPARING: 'Mark ready for pickup',
  READY_FOR_PICKUP: 'Rider picked up',
  RIDER_PICKED_UP: 'Mark delivered',
};

export default function Orders({ vendor }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await VendorPanelAPI.orders(vendor.id);
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [vendor.id]);

  async function advance(order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    await VendorPanelAPI.updateOrderStatus(vendor.id, order.id, next);
    load();
  }

  const active = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const done = orders.filter((o) => ['DELIVERED', 'CANCELLED'].includes(o.status));

  return (
    <div>
      <h1>Orders — {vendor.name}</h1>

      <h2>Active ({active.length})</h2>
      <div className="card">
        {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
        {!loading && active.length === 0 && <p style={{ color: 'var(--muted)' }}>No active orders right now.</p>}
        {active.map((o) => (
          <div className="order-row" key={o.id}>
            <div>
              <strong>#{o.code}</strong>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {o.items.map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(', ')}
              </div>
            </div>
            <span className="status-pill">{o.status.replace(/_/g, ' ')}</span>
            <div style={{ fontWeight: 700 }}>EGP {o.total}</div>
            {NEXT_STATUS[o.status] && (
              <button className="btn btn-primary" onClick={() => advance(o)}>
                {NEXT_LABEL[o.status]}
              </button>
            )}
          </div>
        ))}
      </div>

      <h2>Completed today</h2>
      <div className="card">
        {done.length === 0 && <p style={{ color: 'var(--muted)' }}>Nothing completed yet today.</p>}
        {done.map((o) => (
          <div className="order-row" key={o.id}>
            <strong>#{o.code}</strong>
            <span className={`status-pill ${o.status === 'DELIVERED' ? 'delivered' : ''}`}>{o.status}</span>
            <div style={{ fontWeight: 700 }}>EGP {o.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
