import React, { useEffect, useState } from 'react';
import { AdminAPI } from '../api/client';

export default function AuditLog() {
  const [log, setLog] = useState([]);

  useEffect(() => { AdminAPI.auditLog().then(setLog); }, []);

  return (
    <div>
      <h1>Audit log</h1>
      <p className="page-sub">Read-only. Every admin action, who did it, and when.</p>

      <div className="card">
        {log.map((entry) => (
          <div className="audit-row" key={entry.id}>
            <span className="audit-actor">{entry.actor?.fullName}</span>{' '}
            <span style={{ color: 'var(--muted)' }}>({entry.actor?.role})</span>{' — '}
            {entry.action.replace(/_/g, ' ').toLowerCase()} · {entry.targetType} {entry.targetId.slice(0, 8)}
            <div className="audit-time">{new Date(entry.createdAt).toLocaleString()}</div>
          </div>
        ))}
        {log.length === 0 && <p style={{ color: 'var(--muted)' }}>No admin actions recorded yet.</p>}
      </div>
    </div>
  );
}
