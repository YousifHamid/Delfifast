import React, { useEffect, useState } from 'react';
import { AdminAPI } from '../api/client';

const ROLES = ['CUSTOMER', 'VENDOR_STAFF', 'VENDOR_OWNER', 'ADMIN', 'SUPER_ADMIN'];

export default function Users({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  async function load() {
    const data = await AdminAPI.users(search || undefined);
    setUsers(data);
  }

  useEffect(() => { load(); }, []);

  async function suspend(id) {
    const reason = window.prompt('Reason for suspending this user?');
    if (!reason) return;
    await AdminAPI.suspendUser(id, reason);
    load();
  }

  async function changeRole(id, role) {
    await AdminAPI.changeUserRole(id, role);
    load();
  }

  return (
    <div>
      <h1>Users</h1>
      <p className="page-sub">Search, suspend, or change roles. Role changes require super-admin.</p>

      <div className="card" style={{ display: 'flex', gap: 8 }}>
        <input placeholder="Search name or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-secondary" onClick={load}>Search</button>
      </div>

      <div className="card">
        {users.map((u) => (
          <div className="row" key={u.id}>
            <div>
              <strong>{u.fullName}</strong>{' '}
              {!u.isActive && <span className="pill off">Suspended</span>}
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{u.phone}</div>
            </div>
            {isSuperAdmin ? (
              <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} style={{ width: 160 }}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <span className="pill">{u.role}</span>
            )}
            {u.isActive && <button className="btn btn-danger" onClick={() => suspend(u.id)}>Suspend</button>}
          </div>
        ))}
        {users.length === 0 && <p style={{ color: 'var(--muted)' }}>No users found.</p>}
      </div>
    </div>
  );
}
