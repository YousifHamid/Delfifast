import React, { useEffect, useState } from 'react';
import { AdminAPI } from '../api/client';

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await AdminAPI.pendingVendors();
    setVendors(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(id) {
    await AdminAPI.approveVendor(id);
    load();
  }

  async function reject(id) {
    const reason = window.prompt('Reason for rejecting this vendor?');
    if (!reason) return;
    await AdminAPI.suspendVendor(id, reason);
    load();
  }

  return (
    <div>
      <h1>Vendor approvals</h1>
      <p className="page-sub">New restaurants and markets waiting to go live.</p>

      <div className="card">
        {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}
        {!loading && vendors.length === 0 && <p style={{ color: 'var(--muted)' }}>Nothing pending.</p>}
        {vendors.map((v) => (
          <div className="row" key={v.id}>
            <div>
              <strong>{v.name}</strong>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{v.type} · {v.district}, {v.city}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" onClick={() => reject(v.id)}>Reject</button>
              <button className="btn btn-primary" onClick={() => approve(v.id)}>Approve</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
