import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../context/AuthContext';
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

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (isPublished = true) => {
    setError('');
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!content || content === '<p><br></p>') { setError('Please write some content.'); return; }
    setLoading(true);
    try {
      const tagsArr = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const res = await api.post('/posts', {
        title: title.trim(), content,
        excerpt: excerpt.trim() || undefined,
        cover_image: coverImage.trim() || undefined,
        tags: tagsArr, is_published: isPublished,
      });
      toast.success(isPublished ? '🎉 Post published!' : '📝 Draft saved!');
      navigate(`/post/${res.data.post.slug}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to publish post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="write-container">
      <div className="write-header">
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>New Post</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)} disabled={loading}>✕ Discard</button>
          <button className="btn btn-ghost" onClick={() => handleSubmit(false)} disabled={loading}>Save Draft</button>
          <button className="btn btn-primary" onClick={() => handleSubmit(true)} disabled={loading}>{loading ? 'Publishing...' : '🚀 Publish'}</button>
        </div>
      </div>
      {error && <div className="global-error" style={{ marginBottom: 16 }}>{error}</div>}
      <input className="write-title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title..." maxLength={200} />
      <textarea className="write-excerpt-input" value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short description (optional)..." rows={2} maxLength={300} />
      <div className="write-meta-row">
        <input className="write-input" value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="🖼️ Cover image URL (optional)" type="url" />
        <input className="write-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="🏷️ Tags (comma separated: travel, tech)" />
      </div>
      {coverImage && (
        <div style={{ marginBottom: 16, borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 200 }}>
          <img src={coverImage} alt="Cover preview" style={{ width: '100%', height: 200, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
        </div>
      )}
      <div className="quill-wrapper">
        <ReactQuill theme="snow" value={content} onChange={setContent} modules={QUILL_MODULES} formats={QUILL_FORMATS} placeholder="Tell your story..." />
      </div>
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn btn-ghost" onClick={() => handleSubmit(false)} disabled={loading}>Save as Draft</button>
        <button className="btn btn-primary btn-lg" onClick={() => handleSubmit(true)} disabled={loading}>{loading ? 'Publishing...' : '🚀 Publish Post'}</button>
      </div>
    </div>
  );
}