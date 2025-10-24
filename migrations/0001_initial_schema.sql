-- Global Dating & Marriage Platform Database Schema
-- Supports 7 languages: Korean, English, Chinese, Japanese, Vietnamese, Spanish, Arabic

-- Users Table: Core user information
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT,
  
  -- Profile Information
  name TEXT NOT NULL,
  gender TEXT CHECK(gender IN ('male', 'female', 'other')),
  birth_date DATE,
  country TEXT NOT NULL,
  city TEXT,
  language TEXT DEFAULT 'en' CHECK(language IN ('ko', 'en', 'zh', 'ja', 'vi', 'es', 'ar')),
  
  -- Bio and Interests
  bio TEXT,
  interests TEXT, -- JSON array
  mbti TEXT CHECK(mbti IN ('ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ', '')),
  
  -- Verification Status
  verified INTEGER DEFAULT 0, -- 0: not verified, 1: verified
  verification_count INTEGER DEFAULT 0, -- Number of social media accounts verified
  face_verified INTEGER DEFAULT 0,
  document_verified INTEGER DEFAULT 0,
  admin_approved INTEGER DEFAULT 0,
  
  -- Account Status
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deleted')),
  membership_tier TEXT DEFAULT 'free' CHECK(membership_tier IN ('free', 'premium')),
  
  -- Points and Rewards
  points INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Social Media Verifications Table
CREATE TABLE IF NOT EXISTS social_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('facebook', 'instagram', 'kakao', 'x', 'naver', 'google', 'wechat')),
  provider_id TEXT NOT NULL,
  provider_username TEXT,
  access_token TEXT,
  verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, provider)
);

-- User Media Table: Photos and Videos
CREATE TABLE IF NOT EXISTS user_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('photo', 'video', 'story')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_profile INTEGER DEFAULT 0, -- Main profile photo
  display_order INTEGER DEFAULT 0,
  
  -- Moderation
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  ai_checked INTEGER DEFAULT 0,
  admin_checked INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME, -- For stories (24 hours)
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Preferences for Matching
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  
  -- Age preferences
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 99,
  
  -- Location preferences
  preferred_countries TEXT, -- JSON array
  max_distance INTEGER, -- in kilometers
  
  -- Other preferences
  preferred_gender TEXT CHECK(preferred_gender IN ('male', 'female', 'both')),
  preferred_languages TEXT, -- JSON array
  preferred_interests TEXT, -- JSON array
  
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Matches Table: User matching records
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user1_id INTEGER NOT NULL,
  user2_id INTEGER NOT NULL,
  
  -- Matching algorithm
  match_score REAL DEFAULT 0,
  match_type TEXT DEFAULT 'auto' CHECK(match_type IN ('auto', 'manual', 'ai')),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'blocked')),
  
  -- Who initiated
  initiated_by INTEGER, -- user_id
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user1_id, user2_id)
);

-- Messages Table: Chat messages with translation
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  
  -- Message content
  original_text TEXT NOT NULL,
  original_language TEXT NOT NULL,
  translated_text TEXT, -- Auto-translated to receiver's language
  translated_language TEXT,
  
  -- Message type
  type TEXT DEFAULT 'text' CHECK(type IN ('text', 'photo', 'video', 'voice')),
  media_url TEXT,
  
  -- Status
  read_status INTEGER DEFAULT 0,
  read_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Video Calls Table: Video/Voice call records
CREATE TABLE IF NOT EXISTS video_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caller_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  
  -- Call details
  type TEXT DEFAULT 'video' CHECK(type IN ('video', 'voice')),
  status TEXT DEFAULT 'initiated' CHECK(status IN ('initiated', 'ringing', 'connected', 'ended', 'missed', 'rejected')),
  
  -- Session info
  session_id TEXT,
  
  -- Duration
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  duration INTEGER DEFAULT 0, -- in seconds
  
  -- Quality metrics
  quality_rating INTEGER, -- 1-5 stars
  
  FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Reviews Table: After interaction reviews
CREATE TABLE IF NOT EXISTS user_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reviewer_id INTEGER NOT NULL,
  reviewed_user_id INTEGER NOT NULL,
  
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(reviewer_id, reviewed_user_id)
);

-- Gifts Table: Virtual gifts system
CREATE TABLE IF NOT EXISTS gifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  cost_points INTEGER NOT NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gift Transactions Table
CREATE TABLE IF NOT EXISTS gift_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  
  message TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (gift_id) REFERENCES gifts(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Point Transactions Table
CREATE TABLE IF NOT EXISTS point_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  amount INTEGER NOT NULL, -- Positive for credit, negative for debit
  type TEXT NOT NULL CHECK(type IN ('purchase', 'gift_sent', 'gift_received', 'reward', 'referral', 'admin')),
  description TEXT,
  
  balance_after INTEGER NOT NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reports Table: User reports for safety
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL,
  reported_user_id INTEGER NOT NULL,
  
  reason TEXT NOT NULL CHECK(reason IN ('inappropriate_content', 'harassment', 'fake_profile', 'spam', 'other')),
  description TEXT,
  
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  
  -- Admin review
  reviewed_by INTEGER, -- admin user_id
  reviewed_at DATETIME,
  admin_notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Blocked Users Table
CREATE TABLE IF NOT EXISTS blocked_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_id INTEGER NOT NULL,
  blocked_user_id INTEGER NOT NULL,
  
  reason TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(blocker_id, blocked_user_id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  type TEXT NOT NULL CHECK(type IN ('match', 'message', 'call', 'gift', 'like', 'system')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Related entities
  related_user_id INTEGER,
  related_entity_type TEXT,
  related_entity_id INTEGER,
  
  read_status INTEGER DEFAULT 0,
  read_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity Logs Table: For AI matching algorithm
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  activity_type TEXT NOT NULL CHECK(activity_type IN ('login', 'profile_view', 'like', 'message_sent', 'call_made', 'search')),
  target_user_id INTEGER,
  metadata TEXT, -- JSON for additional data
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);

CREATE INDEX IF NOT EXISTS idx_social_verifications_user_id ON social_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_social_verifications_provider ON social_verifications(provider);

CREATE INDEX IF NOT EXISTS idx_user_media_user_id ON user_media(user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_type ON user_media(type);
CREATE INDEX IF NOT EXISTS idx_user_media_status ON user_media(status);

CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_video_calls_caller ON video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_receiver ON video_calls(receiver_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_status);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);
