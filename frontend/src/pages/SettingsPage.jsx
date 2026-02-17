import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    website: user?.website || '',
    avatar_url: user?.avatar_url || '',
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', form);
      updateUser(res.data.user);
      toast.success('Profile updated! ✨');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <h1 className="settings-title" style={{ margin: 0 }}>Settings</h1>
      </div>
      <form onSubmit={handleSave}>
        <div className="settings-card">
          <div className="settings-section-title">Profile</div>
          <div className="settings-avatar-row">
            <img src={form.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt="Avatar" className="avatar avatar-xl" />
            <div style={{ flex: 1 }}>
              <div className="form-group">
                <label className="form-label">Avatar URL</label>
                <input className="form-input" value={form.avatar_url} onChange={set('avatar_url')} placeholder="https://example.com/avatar.jpg" type="url" />
              </div>
            </div>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.full_name} onChange={set('full_name')} placeholder="Your display name" />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={user?.username} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Username cannot be changed</span>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="settings-textarea" value={form.bio} onChange={set('bio')} placeholder="Tell the world about yourself..." maxLength={300} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{form.bio.length}/300</span>
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" value={form.website} onChange={set('website')} placeholder="https://yourwebsite.com" type="url" />
            </div>
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-section-title">Account</div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.email}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email address</div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(`/${user?.username}`)}>View Profile</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : '✓ Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}