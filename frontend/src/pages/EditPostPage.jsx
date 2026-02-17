import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api, useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ],
};

const QUILL_FORMATS = ['header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block', 'list', 'bullet', 'link', 'image'];

export default function EditPostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    api.get(`/users/${user.username}/posts`).then(res => {
      const post = res.data.posts.find(p => p.id === parseInt(id));
      if (!post) { navigate('/'); return; }
      setSlug(post.slug);
      setTitle(post.title);
      setExcerpt(post.excerpt || '');
      setCoverImage(post.cover_image || '');
      setTags((post.tags || []).join(', '));
      api.get(`/posts/${post.slug}`).then(r => {
        setContent(r.data.post.content);
        setFetching(false);
      });
    }).catch(() => navigate('/'));
  }, [id]);

  const handleUpdate = async () => {
    setError('');
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!content || content === '<p><br></p>') { setError('Content cannot be empty.'); return; }
    setLoading(true);
    try {
      const tagsArr = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const res = await api.put(`/posts/${id}`, {
        title: title.trim(), content,
        excerpt: excerpt.trim() || undefined,
        cover_image: coverImage.trim() || undefined,
        tags: tagsArr,
      });
      toast.success('Post updated!');
      navigate(`/post/${res.data.post.slug}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update post.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="write-container">
      <div className="write-header">
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Edit Post</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => navigate(`/post/${slug}`)} disabled={loading}>✕ Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>{loading ? 'Saving...' : '✓ Save Changes'}</button>
        </div>
      </div>
      {error && <div className="global-error" style={{ marginBottom: 16 }}>{error}</div>}
      <input className="write-title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title..." />
      <textarea className="write-excerpt-input" value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short description..." rows={2} />
      <div className="write-meta-row">
        <input className="write-input" value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="🖼️ Cover image URL" type="url" />
        <input className="write-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="🏷️ Tags (comma separated)" />
      </div>
      {coverImage && (
        <div style={{ marginBottom: 16, borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 200 }}>
          <img src={coverImage} alt="Cover" style={{ width: '100%', height: 200, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
        </div>
      )}
      <div className="quill-wrapper">
        <ReactQuill theme="snow" value={content} onChange={setContent} modules={QUILL_MODULES} formats={QUILL_FORMATS} placeholder="Tell your story..." />
      </div>
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn btn-primary btn-lg" onClick={handleUpdate} disabled={loading}>{loading ? 'Saving...' : '✓ Save Changes'}</button>
      </div>
    </div>
  );
}