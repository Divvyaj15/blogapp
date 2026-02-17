-- BlogApp Database Schema
-- Run this in pgAdmin4 Query Tool

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT true,
  read_time INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Follows table (followers/following like Instagram)
CREATE TABLE follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Likes table
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Comments table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_comments_post ON comments(post_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample seed data (optional)
INSERT INTO users (username, email, password_hash, full_name, bio, avatar_url) VALUES
  ('jane_writes', 'jane@example.com', '$2b$10$placeholder', 'Jane Doe', 'Writer, thinker, coffee addict. ✍️', 'https://i.pravatar.cc/150?img=47'),
  ('techbro_dev', 'dev@example.com', '$2b$10$placeholder', 'Alex Chen', 'Software engineer & blogger 🚀', 'https://i.pravatar.cc/150?img=12'),
  ('nomad_writer', 'nomad@example.com', '$2b$10$placeholder', 'Sara Kim', 'Travel blogger 🌍 | 30 countries done', 'https://i.pravatar.cc/150?img=32');

INSERT INTO posts (user_id, title, slug, content, excerpt, cover_image, tags, read_time) VALUES
  (1, 'The Art of Slow Living', 'the-art-of-slow-living',
   '<h2>Why Slowing Down is the New Productivity</h2><p>In a world obsessed with hustle culture and constant optimization, there''s a quiet revolution happening. People are choosing to slow down, breathe, and actually <strong>experience</strong> their lives rather than just rushing through them.</p><p>Slow living isn''t about being lazy or unambitious. It''s about being intentional with your time and energy. It''s about asking yourself: <em>does this truly matter?</em></p><h3>The Science Behind It</h3><p>Research consistently shows that chronic stress and overwork lead to burnout, decreased creativity, and worse decision-making. Taking breaks, spending time in nature, and cultivating meaningful relationships aren''t luxuries — they''re necessities for a well-functioning mind.</p><p>When we slow down, we actually become more productive in the hours we do work. We make better decisions. We enjoy our lives more. The irony is that slowing down might be the fastest path to the life you actually want.</p>',
   'In a world obsessed with hustle culture, there''s a quiet revolution happening. People are choosing to slow down and actually experience their lives.',
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
   ARRAY['lifestyle', 'mindfulness', 'productivity'], 4),
  (2, 'Building APIs That Don''t Suck', 'building-apis-that-dont-suck',
   '<h2>REST API Design Principles for 2024</h2><p>After reviewing hundreds of APIs over my career, I''ve noticed patterns that separate the ones developers love from the ones they dread at 2am. Here are the principles I''ve come to live by.</p><h3>1. Be Predictable</h3><p>The best APIs are boring. When a developer encounters a new endpoint, they should be able to <strong>guess how it works</strong> based on their experience with the rest of your API. Consistency beats cleverness every time.</p><h3>2. Error Messages Are Documentation</h3><p>A generic <code>500 Internal Server Error</code> teaches nothing. A detailed error response with a code, message, and suggestion? That''s an API that respects its users.</p><h3>3. Version from Day One</h3><p>You will change your API. Users will depend on it. Version it from the start, and you''ll thank yourself later. <code>/api/v1/users</code> is not premature optimization — it''s respect for your future self.</p>',
   'After reviewing hundreds of APIs over my career, I''ve noticed patterns that separate the ones developers love from the ones they dread at 2am.',
   'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
   ARRAY['engineering', 'api', 'backend'], 6),
  (3, 'Tokyo on $50 a Day: A Realistic Guide', 'tokyo-on-50-a-day',
   '<h2>Yes, Tokyo Can Be Budget-Friendly</h2><p>Everyone told me Tokyo would drain my wallet. They were wrong — or at least, they hadn''t done their research. After spending three weeks in Japan''s capital on a tight budget, I can tell you it''s absolutely possible to have an incredible experience without spending a fortune.</p><h3>Where to Sleep</h3><p>Capsule hotels are your best friend. Not only are they affordable (¥2,000–¥4,000/night), but they''re also a uniquely Japanese experience. I stayed at <strong>nine hours Shinjuku</strong> — clean, stylish, and perfectly located.</p><h3>Where to Eat</h3><p>Forget tourist restaurants. Convenience stores (konbini) in Japan are genuinely delicious and absurdly cheap. A full meal from 7-Eleven or Lawson runs ¥400–¥600. Add in the incredible ramen spots tucked in train stations, and you can eat like royalty on ¥1,500/day.</p>',
   'Everyone told me Tokyo would drain my wallet. After three weeks on a tight budget, I can tell you they were wrong.',
   'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
   ARRAY['travel', 'japan', 'budget'], 7);

INSERT INTO follows (follower_id, following_id) VALUES (1, 2), (1, 3), (2, 1), (3, 1), (3, 2);
INSERT INTO likes (user_id, post_id) VALUES (1, 2), (1, 3), (2, 1), (2, 3), (3, 1), (3, 2);
INSERT INTO comments (user_id, post_id, content) VALUES
  (2, 1, 'This really resonated with me. Taking a break this weekend because of this post!'),
  (3, 1, 'Beautifully written. The slow living movement needs more voices like yours.'),
  (1, 2, 'Solid advice. The versioning tip saved us from a major headache last year.'),
  (1, 3, 'Saving this for my Tokyo trip next spring! The konbini tip is gold.');