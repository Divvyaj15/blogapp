import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';

function UsersModal({ title, users, loading, onClose, onNavigate }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '420px',
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          animation: 'cardFadeIn 0.2s ease',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.3rem', margin: 0 }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-elevated)', border: 'none', color: 'var(--text-secondary)',
              width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
              fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <div className="spinner" />
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👤</div>
              <div style={{ fontSize: '0.95rem' }}>No {title.toLowerCase()} yet</div>
            </div>
          ) : (
            users.map(user => (
              <div
                key={user.id}
                onClick={() => { onNavigate(`/${user.username}`); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 24px', cursor: 'pointer', transition: 'var(--transition)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  alt={user.username}
                  style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {user.full_name || user.username}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>@{user.username}</div>
                  {user.bio && (
                    <div style={{
                      fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {user.bio}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [modal, setModal] = useState(null);
  const [modalUsers, setModalUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPostsLoading(true);
    setPosts([]);
    setPage(1);
    api.get(`/users/${username}`)
      .then(res => {
        setProfile(res.data.user);
        setLoading(false);
      })
      .catch(() => navigate('/'));
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    setPostsLoading(true);
    api.get(`/users/${username}/posts`, { params: { page, limit: 12 } })
      .then(res => {
        setPosts(prev => page === 1 ? res.data.posts : [...prev, ...res.data.posts]);
        setHasMore(res.data.pagination.page * res.data.pagination.limit < res.data.pagination.total);
        setPostsLoading(false);
      })
      .catch(() => setPostsLoading(false));
  }, [profile, page]);

  const handleFollow = async () => {
    if (!currentUser) { navigate('/login'); return; }
    setFollowLoading(true);
    try {
      const res = await api.post(`/users/${username}/follow`);
      setProfile(prev => ({
        ...prev,
        is_following: res.data.following,
        followers_count: res.data.followers_count,
      }));
      toast.success(res.data.following ? `Following @${username}` : `Unfollowed @${username}`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLikeToggle = (postId, liked, likes_count) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked: liked, likes_count } : p));
  };

  const openModal = async (type) => {
    setModal(type);
    setModalUsers([]);
    setModalLoading(true);
    try {
      const res = await api.get(`/users/${username}/${type}`);
      setModalUsers(res.data.users);
    } catch {
      toast.error('Could not load users');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!profile) return null;

  const isOwn = currentUser?.username === profile.username;

  return (
    <div className="profile-container">

      {modal && (
        <UsersModal
          title={modal === 'followers' ? 'Followers' : 'Following'}
          users={modalUsers}
          loading={modalLoading}
          onClose={() => setModal(null)}
          onNavigate={navigate}
        />
      )}

      <div className="profile-header">
        <img
          src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
          alt={profile.username}
          className="avatar avatar-xl"
        />
        <div className="profile-info">
          <h1 className="profile-name">{profile.full_name || profile.username}</h1>
          <div className="profile-username">@{profile.username}</div>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.9rem', color: 'var(--accent)', marginBottom: 16, display: 'block' }}
            >
              🔗 {profile.website}
            </a>
          )}

          <div className="profile-stats">
            <div className="stat">
              <span className="stat-value">{profile.posts_count}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div
              className="stat"
              onClick={() => openModal('followers')}
              style={{ cursor: 'pointer' }}
            >
              <span className="stat-value">{Number(profile.followers_count).toLocaleString()}</span>
              <span className="stat-label" style={{ color: 'var(--accent)' }}>Followers</span>
            </div>
            <div
              className="stat"
              onClick={() => openModal('following')}
              style={{ cursor: 'pointer' }}
            >
              <span className="stat-value">{Number(profile.following_count).toLocaleString()}</span>
              <span className="stat-label" style={{ color: 'var(--accent)' }}>Following</span>
            </div>
          </div>

          {isOwn ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => navigate('/settings')}>⚙️ Edit Profile</button>
              <button className="btn btn-primary" onClick={() => navigate('/write/new')}>✏️ New Post</button>
            </div>
          ) : currentUser ? (
            <button
              className={`follow-btn ${profile.is_following ? 'following' : 'not-following'}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? '...' : profile.is_following ? 'Following ✓' : '+ Follow'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Follow</button>
          )}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.3rem', marginBottom: 20, color: 'var(--text-secondary)' }}>
          {posts.length === 0 && !postsLoading
            ? 'No posts yet'
            : `${profile.posts_count} Post${profile.posts_count !== 1 ? 's' : ''}`}
        </div>

        {postsLoading && posts.length === 0 ? (
          <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">No posts yet</div>
            {isOwn && (
              <>
                <div className="empty-state-desc">Share your first story with the world!</div>
                <button className="btn btn-primary" onClick={() => navigate('/write/new')}>
                  ✏️ Write your first post
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="posts-grid">
              {posts.map((post, i) => (
                <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} style={{ index: i }} />
              ))}
            </div>
            {hasMore && (
              <div className="load-more-container">
                <button
                  className="load-more-btn"
                  onClick={() => setPage(p => p + 1)}
                  disabled={postsLoading}
                >
                  {postsLoading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}