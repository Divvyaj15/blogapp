import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          Inkwell
        </span>

        <div className="navbar-search">
          <span className="navbar-search-icon">🔍</span>
          <form onSubmit={handleSearch}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..." />
          </form>
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/write/new')}>
                ✏️ Write
              </button>
              <div className="user-menu-wrapper" ref={menuRef}>
                <button className="user-menu-trigger" onClick={() => setMenuOpen(v => !v)}>
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt={user.username}
                    className="avatar avatar-sm"
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {user.username}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>▼</span>
                </button>
                {menuOpen && (
                  <div className="user-menu">
                    <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.full_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{user.username}</div>
                    </div>
                    <button className="user-menu-item" onClick={() => { navigate(`/${user.username}`); setMenuOpen(false); }}>👤 Profile</button>
                    <button className="user-menu-item" onClick={() => { navigate('/write/new'); setMenuOpen(false); }}>✏️ New Post</button>
                    <button className="user-menu-item" onClick={() => { navigate('/settings'); setMenuOpen(false); }}>⚙️ Settings</button>
                    <div className="user-menu-divider" />
                    <button className="user-menu-item danger" onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}>🚪 Log Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Log in</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Sign up</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}