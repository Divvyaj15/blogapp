import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

const POPULAR_TAGS = ['engineering', 'lifestyle', 'travel', 'mindfulness', 'productivity', 'design', 'science', 'culture', 'startup', 'health'];

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [feedTab, setFeedTab] = useState('all');
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  const tag = searchParams.get('tag');
  const search = searchParams.get('search');

  const fetchPosts = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const res = await api.get('/posts', { params: { page: currentPage, limit: 12, feed: feedTab, tag, search } });
      if (reset) setPosts(res.data.posts);
      else setPosts(prev => [...prev, ...res.data.posts]);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, [page, feedTab, tag, search]);

  useEffect(() => { setPage(1); fetchPosts(true); }, [feedTab, tag, search]);
  useEffect(() => { if (page > 1) fetchPosts(false); }, [page]);
  useEffect(() => { api.get('/users').then(res => setSuggestedUsers(res.data.users.slice(0, 5))).catch(() => {}); }, []);

  const handleLikeToggle = (postId, liked, likes_count) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked: liked, likes_count } : p));
  };

  const handleFollowSuggested = async (username) => {
    if (!user) { navigate('/login'); return; }
    try {
      await api.post(`/users/${username}/follow`);
      setSuggestedUsers(prev => prev.filter(u => u.username !== username));
    } catch {}
  };

  return (
    <div className="home-container">
      <div>
        <div className="feed-header">
          <div className="feed-tabs">
            <button className={`feed-tab ${feedTab === 'all' ? 'active' : ''}`} onClick={() => setFeedTab('all')}>🌐 Explore</button>
            {user && <button className={`feed-tab ${feedTab === 'following' ? 'active' : ''}`} onClick={() => setFeedTab('following')}>✨ Following</button>}
          </div>
          {tag && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="tag">#{tag}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>✕ Clear</button>
            </div>
          )}
        </div>

        {search && <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Search results for <strong style={{ color: 'var(--text-primary)' }}>"{search}"</strong></div>}

        {loading && posts.length === 0 ? (
          <div className="posts-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="post-card" style={{ animation: 'none' }}>
                <div className="post-card-image-placeholder" style={{ opacity: 0.3 }}>⏳</div>
                <div className="post-card-body">
                  <div style={{ height: 12, background: 'var(--bg-elevated)', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 20, background: 'var(--bg-elevated)', borderRadius: 6, marginBottom: 6, width: '80%' }} />
                  <div style={{ height: 14, background: 'var(--bg-elevated)', borderRadius: 6, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{feedTab === 'following' ? '🔭' : '📭'}</div>
            <div className="empty-state-title">{feedTab === 'following' ? 'No posts from people you follow' : 'No posts yet'}</div>
            <div className="empty-state-desc">{feedTab === 'following' ? 'Follow some writers to see their posts here' : 'Be the first to write something!'}</div>
            {user && <button className="btn btn-primary" onClick={() => navigate('/write/new')}>✏️ Write a post</button>}
          </div>
        ) : (
          <>
            <div className="posts-grid">
              {posts.map((post, i) => <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} style={{ index: i }} />)}
            </div>
            {hasMore && (
              <div className="load-more-container">
                <button className="load-more-btn" onClick={() => setPage(p => p + 1)} disabled={loading}>
                  {loading ? 'Loading...' : 'Load more posts'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <aside className="home-sidebar">
        {!user && (
          <div className="sidebar-section" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>✍️</div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.2rem', marginBottom: 8 }}>Share your stories</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>Join thousands of writers on Inkwell and build your audience.</div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/register')}>Get started — it's free</button>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('/login')}>Already have an account?</button>
          </div>
        )}
        {suggestedUsers.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-title">Writers to follow</div>
            {suggestedUsers.map(u => (
              <div key={u.id} className="sidebar-user">
                <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt={u.username} className="avatar avatar-sm" onClick={() => navigate(`/${u.username}`)} />
                <div className="sidebar-user-info" onClick={() => navigate(`/${u.username}`)}>
                  <div className="sidebar-user-name">{u.full_name || u.username}</div>
                  <div className="sidebar-user-handle">@{u.username}</div>
                </div>
                <button className="sidebar-follow-btn" onClick={() => handleFollowSuggested(u.username)}>Follow</button>
              </div>
            ))}
          </div>
        )}
        <div className="sidebar-section">
          <div className="sidebar-title">Browse topics</div>
          <div className="sidebar-tag-cloud">
            {POPULAR_TAGS.map(t => <span key={t} className="tag" onClick={() => navigate(`/?tag=${t}`)} style={{ cursor: 'pointer' }}>{t}</span>)}
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.7, padding: '0 4px' }}>
          © 2025 Inkwell · Built with ❤️ using React, Express & PostgreSQL
        </div>
      </aside>
    </div>
  );
}