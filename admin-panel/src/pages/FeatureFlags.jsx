import React, { useEffect, useState } from 'react';
import { AdminAPI } from '../api/client';

// Known flags the platform understands today. New ones can be created
// ad hoc via the API too; this list just gives a friendly starting UI.
const KNOWN_FLAGS = [
  { key: 'supermarket_vertical_enabled', label: 'Supermarket vertical', description: 'Show supermarket vendors and grocery filters in the customer app.' },
  { key: 'card_on_delivery_enabled', label: 'Card on delivery', description: 'Offer card-on-delivery as a payment option at checkout.' },
];

export default function FeatureFlags() {
  const [flags, setFlags] = useState({});

  async function load() {
    const data = await AdminAPI.featureFlags();
    const map = {};
    data.forEach((f) => { map[f.key] = f.isEnabled; });
    setFlags(map);
  }

  useEffect(() => { load(); }, []);

  async function toggle(key) {
    const next = !flags[key];
    await AdminAPI.setFeatureFlag(key, next);
    load();
  }

  return (
    <div>
      <h1>Feature flags</h1>
      <p className="page-sub">Platform-wide switches — changes take effect immediately, no deploy needed.</p>

      <div className="card">
        {KNOWN_FLAGS.map((f) => (
          <div className="row" key={f.key}>
            <div>
              <strong>{f.label}</strong>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{f.description}</div>
            </div>
            <button
              className={`btn ${flags[f.key] ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => toggle(f.key)}
            >
              {flags[f.key] ? 'On' : 'Off'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
