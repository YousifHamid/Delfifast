import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Vendors from './pages/Vendors';
import Users from './pages/Users';
import Orders from './pages/Orders';
import FeatureFlags from './pages/FeatureFlags';
import AuditLog from './pages/AuditLog';

function Shell({ user, children }) {
  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="brand">Delifast</div>
        <div className="brand-sub">ADMIN</div>
        <NavLink to="/vendors" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Vendor approvals</NavLink>
        <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Users</NavLink>
        <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Orders</NavLink>
        <NavLink to="/feature-flags" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Feature flags</NavLink>
        <NavLink to="/audit-log" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Audit log</NavLink>
        <div className="sidebar-footer">
          <div className="who">{user.fullName}</div>
          <div className="role">{user.role}</div>
        </div>
      </div>
      <div className="main">{children}</div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLoggedIn={setUser} />} />
        <Route path="/vendors" element={user ? <Shell user={user}><Vendors /></Shell> : <Navigate to="/login" />} />
        <Route path="/users" element={user ? <Shell user={user}><Users currentUser={user} /></Shell> : <Navigate to="/login" />} />
        <Route path="/orders" element={user ? <Shell user={user}><Orders /></Shell> : <Navigate to="/login" />} />
        <Route path="/feature-flags" element={user ? <Shell user={user}><FeatureFlags /></Shell> : <Navigate to="/login" />} />
        <Route path="/audit-log" element={user ? <Shell user={user}><AuditLog /></Shell> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? '/vendors' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}
