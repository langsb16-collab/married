-- Seed Data for Global Dating & Marriage Platform

-- Insert sample gifts
INSERT OR IGNORE INTO gifts (id, name, description, icon_url, cost_points) VALUES 
  (1, 'Rose', 'A beautiful red rose', '/static/gifts/rose.png', 10),
  (2, 'Heart', 'A lovely heart', '/static/gifts/heart.png', 20),
  (3, 'Diamond', 'A precious diamond', '/static/gifts/diamond.png', 100),
  (4, 'Coffee', 'Virtual coffee date', '/static/gifts/coffee.png', 15),
  (5, 'Teddy Bear', 'Cute teddy bear', '/static/gifts/teddy.png', 50);

-- Insert demo users (password hash is for 'password123')
INSERT OR IGNORE INTO users (id, email, name, gender, birth_date, country, language, bio, interests, mbti, verified, verification_count, face_verified, admin_approved, points) VALUES 
  (1, 'alice@example.com', 'Alice Kim', 'female', '1995-03-15', 'South Korea', 'ko', '안녕하세요! 새로운 인연을 찾고 있어요.', '["travel", "music", "cooking"]', 'ENFP', 1, 3, 1, 1, 100),
  (2, 'bob@example.com', 'Bob Smith', 'male', '1992-07-22', 'USA', 'en', 'Looking for meaningful connections across borders.', '["sports", "technology", "travel"]', 'ISTJ', 1, 3, 1, 1, 150),
  (3, 'chen@example.com', 'Chen Wei', 'male', '1994-11-08', 'China', 'zh', '我喜欢旅行和认识新朋友。', '["photography", "food", "art"]', 'INFJ', 1, 3, 1, 1, 200),
  (4, 'sakura@example.com', 'Sakura Tanaka', 'female', '1996-05-20', 'Japan', 'ja', '世界中の人々と繋がりたいです。', '["anime", "reading", "music"]', 'ISFP', 1, 3, 1, 1, 120),
  (5, 'maria@example.com', 'Maria Garcia', 'female', '1993-09-12', 'Spain', 'es', '¡Hola! Me encanta conocer gente de diferentes culturas.', '["dance", "travel", "language"]', 'ESFP', 1, 3, 1, 1, 80);

-- Insert social verifications
INSERT OR IGNORE INTO social_verifications (user_id, provider, provider_id, provider_username) VALUES 
  (1, 'facebook', 'fb_alice123', 'alice.kim'),
  (1, 'instagram', 'ig_alice123', '@alice_kim'),
  (1, 'kakao', 'kakao_alice123', 'alicekim'),
  (2, 'facebook', 'fb_bob456', 'bob.smith'),
  (2, 'x', 'x_bob456', '@bobsmith'),
  (2, 'google', 'google_bob456', 'bob.smith'),
  (3, 'wechat', 'wc_chen789', 'chenwei'),
  (3, 'facebook', 'fb_chen789', 'chen.wei'),
  (3, 'instagram', 'ig_chen789', '@chenwei');

-- Insert user preferences
INSERT OR IGNORE INTO user_preferences (user_id, min_age, max_age, preferred_gender, preferred_countries, preferred_languages) VALUES 
  (1, 25, 35, 'male', '["USA", "UK", "Canada", "Australia"]', '["en", "ko"]'),
  (2, 23, 33, 'female', '["South Korea", "Japan", "China"]', '["ko", "ja", "zh"]'),
  (3, 24, 34, 'female', '["South Korea", "Japan", "USA"]', '["ko", "ja", "en"]'),
  (4, 25, 35, 'male', '["USA", "UK", "South Korea"]', '["en", "ko"]'),
  (5, 26, 36, 'male', '["USA", "UK", "France"]', '["en", "es"]');

-- Insert some sample matches
INSERT OR IGNORE INTO matches (user1_id, user2_id, match_score, match_type, status, initiated_by) VALUES 
  (1, 2, 0.85, 'ai', 'accepted', 1),
  (3, 4, 0.78, 'ai', 'accepted', 3),
  (1, 3, 0.72, 'auto', 'pending', 1),
  (2, 5, 0.80, 'ai', 'accepted', 2);

-- Insert sample messages
INSERT OR IGNORE INTO messages (sender_id, receiver_id, original_text, original_language, translated_text, translated_language, type, read_status) VALUES 
  (1, 2, '안녕하세요! 프로필이 정말 멋지네요.', 'ko', 'Hello! Your profile is really nice.', 'en', 'text', 1),
  (2, 1, 'Thank you! I would love to get to know you better.', 'en', '감사합니다! 더 알고 싶어요.', 'ko', 'text', 1),
  (3, 4, '你好！很高兴认识你。', 'zh', 'こんにちは！お会いできて嬉しいです。', 'ja', 'text', 1);

-- Insert sample notifications
INSERT OR IGNORE INTO notifications (user_id, type, title, content, related_user_id) VALUES 
  (1, 'match', 'New Match!', 'You have a new match with Bob Smith', 2),
  (2, 'message', 'New Message', 'Alice Kim sent you a message', 1),
  (3, 'match', 'New Match!', 'You have a new match with Sakura Tanaka', 4),
  (4, 'message', 'New Message', 'Chen Wei sent you a message', 3);
