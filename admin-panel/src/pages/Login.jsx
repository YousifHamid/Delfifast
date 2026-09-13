import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthAPI } from '../api/client';

// Steps: 'credentials' -> (maybe) 'setup_2fa' or 'enter_code' -> done
export default function Login({ onLoggedIn }) {
  const [step, setStep] = useState('credentials');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function finishLogin(token, user) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      setError('This account does not have admin access.');
      return;
    }
    localStorage.setItem('delifast_admin_token', token);
    onLoggedIn(user);
    navigate('/vendors');
  }

  async function submitCredentials(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await AuthAPI.login({ phone, password });
      await finishLogin(token, user);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.code === 'TWO_FACTOR_SETUP_REQUIRED' && data?.setupToken) {
        setSetupToken(data.setupToken);
        const setup = await AuthAPI.setupTwoFactor(data.setupToken);
        setSecret(setup.base32Secret);
        setStep('setup_2fa');
      } else if (data?.code === 'TWO_FACTOR_CODE_REQUIRED') {
        setStep('enter_code');
      } else {
        setError(data?.error || 'Could not sign in. Check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function submitCode(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await AuthAPI.login({ phone, password, totpCode });
      await finishLogin(token, user);
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid code — try again.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await AuthAPI.confirmTwoFactor(setupToken, totpCode);
      await finishLogin(token, user);
    } catch (err) {
      setError(err?.response?.data?.error || 'Code did not match — try again.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'setup_2fa') {
    return (
      <div className="login-screen">
        <form className="login-card" onSubmit={confirmSetup}>
          <h1>Set up 2FA</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
            Add this account to Google Authenticator, Authy, or any TOTP app, then enter the 6-digit code it shows.
          </p>
          <div className="secure-note" style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>{secret}</div>
          {error && <div className="error-text">{error}</div>}
          <div className="field">
            <label>6-digit code</label>
            <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} maxLength={6} inputMode="numeric" required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: 12 }} disabled={loading}>
            {loading ? 'Confirming…' : 'Confirm & sign in'}
          </button>
        </form>
      </div>
    );
  }

  if (step === 'enter_code') {
    return (
      <div className="login-screen">
        <form className="login-card" onSubmit={submitCode}>
          <h1>Enter your code</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>Open your authenticator app for the current 6-digit code.</p>
          {error && <div className="error-text">{error}</div>}
          <div className="field">
            <label>6-digit code</label>
            <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} maxLength={6} inputMode="numeric" required autoFocus />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: 12 }} disabled={loading}>
            {loading ? 'Verifying…' : 'Verify & sign in'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submitCredentials}>
        <h1>Delifast</h1>
        <p style={{ color: 'var(--muted)', marginTop: -8, marginBottom: 20, fontSize: 13 }}>Admin panel</p>
        <div className="secure-note">Restricted access. Every action you take here is recorded in the audit log.</div>
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
