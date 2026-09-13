import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthAPI, api } from '../api/client';

export default function Login({ onLoggedIn }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await AuthAPI.login({ phone, password });
      if (!['VENDOR_OWNER', 'VENDOR_STAFF'].includes(user.role)) {
        setError('This account is not linked to a kitchen.');
        return;
      }
      localStorage.setItem('delifast_vendor_token', token);
      const { data: vendors } = await api.get('/vendor-panel/me');
      if (!vendors.length) {
        setError('No kitchen is linked to this account yet.');
        return;
      }
      onLoggedIn({ user, vendor: vendors[0] });
      navigate('/orders');
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not sign in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Delifast</h1>
        <p style={{ color: 'var(--muted)', marginTop: -8, marginBottom: 24, fontSize: 13 }}>Kitchen dashboard</p>
        {error && <div className="error-text">{error}</div>}
        <div className="field">
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 1xx xxx xxxx" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', padding: 12 }} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
