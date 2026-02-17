import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { api, useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function PostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const commentsRef = useRef(null);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/posts/${slug}`).then(res => {
      setPost(res.data.post); setComments(res.data.comments || []); setLoading(false);
      if (window.location.hash === '#comments') setTimeout(() => commentsRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    }).catch(() => navigate('/'));
  }, [slug]);

  const handleLike = async () => {
    if (!user) { toast('Please log in to like posts'); navigate('/login'); return; }
    if (liking) return;
    setLiking(true);
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      setPost(prev => ({ ...prev, is_liked: res.data.liked, likes_count: res.data.likes_count }));
    } catch { toast.error('Could not like post'); }
    finally { setLiking(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/posts/${post.id}/comments`, { content: commentText.trim() });
      setComments(prev => [...prev, res.data.comment]);
      setCommentText('');
      setPost(prev => ({ ...prev, comments_count: (parseInt(prev.comments_count) || 0) + 1 }));
      toast.success('Comment added!');
    } catch (err) { toast.error(err.response?.data?.error || 'Could not add comment'); }
    finally { setSubmittingComment(false); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/posts/${post.id}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setPost(prev => ({ ...prev, comments_count: Math.max(0, (parseInt(prev.comments_count) || 1) - 1) }));
      toast.success('Comment deleted');
    } catch { toast.error('Could not delete comment'); }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      toast.success('Post deleted');
      navigate(`/${user.username}`);
    } catch { toast.error('Could not delete post'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!post) return null;

  const isOwn = user?.id === post.author_id || user?.username === post.username;

  return (
    <div className="post-page-container">
      {post.cover_image && <img src={post.cover_image} alt={post.title} className="post-page-cover" />}
      {post.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {post.tags.map(tag => <span key={tag} className="tag" onClick={() => navigate(`/?tag=${tag}`)}>{tag}</span>)}
        </div>
      )}
      <h1 className="post-page-title">{post.title}</h1>
      <div className="post-page-meta">
        <div className="post-page-author" onClick={() => navigate(`/${post.username}`)}>
          <img src={post.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} alt={post.username} className="avatar avatar-md" />
          <div>
            <div className="post-author-name">{post.full_name || post.username}</div>
            <div className="post-author-date">@{post.username} · {format(new Date(post.created_at), 'MMM d, yyyy')}</div>
          </div>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 'auto' }}>📖 {post.read_time} min read</span>
        {isOwn && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/write/edit/${post.id}`)}>✏️ Edit</button>
            <button className="btn btn-danger btn-sm" onClick={handleDeletePost}>🗑️ Delete</button>
          </div>
        )}
      </div>

      <div className="post-page-content" dangerouslySetInnerHTML={{ __html: post.content }} />

      <div className="post-actions-bar">
        <button className={`post-like-btn ${post.is_liked ? 'liked' : ''}`} onClick={handleLike} disabled={liking}>
          {post.is_liked ? '❤️' : '🤍'} {post.likes_count || 0} {post.is_liked ? 'Liked' : 'Like'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          💬 {post.comments_count || 0} Comments
        </button>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
          🔗 Share
        </button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 48, display: 'flex', alignItems: 'center', gap: 20 }}>
        <img src={post.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} alt={post.username} className="avatar avatar-lg" style={{ cursor: 'pointer' }} onClick={() => navigate(`/${post.username}`)} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.2rem', cursor: 'pointer', marginBottom: 4 }} onClick={() => navigate(`/${post.username}`)}>{post.full_name || post.username}</div>
          {post.author_bio && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{post.author_bio}</p>}
        </div>
        {!isOwn && <button className="btn btn-primary btn-sm" onClick={() => navigate(`/${post.username}`)}>View Profile</button>}
      </div>

      <div className="comments-section" ref={commentsRef} id="comments">
        <h3 className="comments-title">{comments.length} Comment{comments.length !== 1 ? 's' : ''}</h3>
        {user ? (
          <form className="comment-form" onSubmit={handleComment}>
            <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} className="avatar avatar-sm" style={{ marginTop: 4 }} />
            <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <textarea className="comment-input" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." rows={2}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(e); } }} />
              <button type="submit" className="btn btn-primary btn-sm" disabled={submittingComment || !commentText.trim()} style={{ marginTop: 2 }}>
                {submittingComment ? '...' : 'Post'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20, textAlign: 'center', marginBottom: 24 }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>Join the conversation — log in to comment</div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>Log in</button>
          </div>
        )}
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          <div>
            {comments.map(comment => (
              <div key={comment.id} className="comment">
                <img src={comment.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`} alt={comment.username} className="avatar avatar-sm" style={{ cursor: 'pointer', marginTop: 2 }} onClick={() => navigate(`/${comment.username}`)} />
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="comment-author" style={{ cursor: 'pointer' }} onClick={() => navigate(`/${comment.username}`)}>{comment.full_name || comment.username}</span>
                    <span className="comment-date">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                    {user?.id === comment.user_id && <button className="comment-delete-btn" style={{ marginLeft: 'auto' }} onClick={() => handleDeleteComment(comment.id)}>✕</button>}
                  </div>
                  <p className="comment-text">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}