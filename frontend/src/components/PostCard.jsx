import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { api, useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function PostCard({ post, onLikeToggle, style = {} }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) { toast('Please log in to like posts ✨'); navigate('/login'); return; }
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      onLikeToggle?.(post.id, res.data.liked, res.data.likes_count);
    } catch {
      toast.error('Could not like post');
    }
  };

  const emojis = ['📝', '💡', '🌟', '🎯', '🚀', '💫', '🔥', '✨'];
  const emoji = emojis[post.id % emojis.length];

  return (
    <div
      className="post-card"
      onClick={() => navigate(`/post/${post.slug}`)}
      style={{ animationDelay: `${(style.index || 0) * 60}ms`, ...style }}
    >
      {post.cover_image ? (
        <img src={post.cover_image} alt={post.title} className="post-card-image" />
      ) : (
        <div className="post-card-image-placeholder">{emoji}</div>
      )}

      <div className="post-card-body">
        <div className="post-card-author">
          <img
            src={post.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`}
            alt={post.username}
            className="avatar avatar-sm"
            onClick={(e) => { e.stopPropagation(); navigate(`/${post.username}`); }}
          />
          <div>
            <div className="post-card-author-name" onClick={(e) => { e.stopPropagation(); navigate(`/${post.username}`); }}>
              {post.full_name || post.username}
            </div>
            <div className="post-card-author-handle">
              @{post.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>

        <h3 className="post-card-title">{post.title}</h3>
        {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}

        {post.tags?.length > 0 && (
          <div className="post-card-tags">
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} className="tag" onClick={(e) => { e.stopPropagation(); navigate(`/?tag=${tag}`); }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="post-card-footer">
          <div className="post-card-actions">
            <button className={`action-btn ${post.is_liked ? 'liked' : ''}`} onClick={handleLike}>
              <span className="heart-icon">{post.is_liked ? '❤️' : '🤍'}</span>
              {post.likes_count || 0}
            </button>
            <button className="action-btn" onClick={(e) => { e.stopPropagation(); navigate(`/post/${post.slug}#comments`); }}>
              💬 {post.comments_count || 0}
            </button>
          </div>
          <span className="post-card-read-time">📖 {post.read_time} min</span>
        </div>
      </div>
    </div>
  );
}