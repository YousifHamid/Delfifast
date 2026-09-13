import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Menu from './pages/Menu';

function Shell({ vendor, children }) {
  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="brand">Delifast</div>
        <div className="brand-sub">{vendor.name.toUpperCase()}</div>
        <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Orders</NavLink>
        <NavLink to="/menu" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Menu</NavLink>
      </div>
      <div className="main">{children}</div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null); // { user, vendor }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLoggedIn={setSession} />} />
        <Route
          path="/orders"
          element={session ? <Shell vendor={session.vendor}><Orders vendor={session.vendor} /></Shell> : <Navigate to="/login" />}
        />
        <Route
          path="/menu"
          element={session ? <Shell vendor={session.vendor}><Menu vendor={session.vendor} /></Shell> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to={session ? '/orders' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}
