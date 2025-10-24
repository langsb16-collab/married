// Database utility functions
import type { User, Match, Message, UserMedia, Notification } from '../types';

export async function getUserById(db: D1Database, userId: number): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<User>();
  return result;
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
  return result;
}

export async function getSocialVerifications(db: D1Database, userId: number) {
  const result = await db.prepare('SELECT * FROM social_verifications WHERE user_id = ?').bind(userId).all();
  return result.results;
}

export async function getUserMedia(db: D1Database, userId: number, type?: 'photo' | 'video' | 'story') {
  let query = 'SELECT * FROM user_media WHERE user_id = ? AND status = ?';
  const params: any[] = [userId, 'approved'];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY display_order ASC, created_at DESC';
  
  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all();
  return result.results;
}

export async function getMatches(db: D1Database, userId: number, status?: string) {
  let query = `
    SELECT m.*, 
           u.id as match_user_id, u.name, u.birth_date, u.gender, u.country, u.bio, 
           u.verified, u.verification_count
    FROM matches m
    JOIN users u ON (
      CASE 
        WHEN m.user1_id = ? THEN u.id = m.user2_id
        ELSE u.id = m.user1_id
      END
    )
    WHERE (m.user1_id = ? OR m.user2_id = ?)
  `;
  
  const params: any[] = [userId, userId, userId];
  
  if (status) {
    query += ' AND m.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY m.created_at DESC';
  
  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all();
  return result.results;
}

export async function getMessages(db: D1Database, userId: number, otherUserId: number, limit = 50) {
  const query = `
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) 
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at DESC
    LIMIT ?
  `;
  
  const result = await db.prepare(query)
    .bind(userId, otherUserId, otherUserId, userId, limit)
    .all();
    
  return result.results.reverse(); // Return in chronological order
}

export async function getConversations(db: D1Database, userId: number) {
  const query = `
    SELECT 
      m.*,
      u.id as other_user_id,
      u.name as other_user_name,
      u.verified as other_user_verified
    FROM (
      SELECT 
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_id,
        MAX(created_at) as last_message_time,
        id, sender_id, receiver_id, original_text, created_at, read_status
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY other_id
    ) m
    JOIN users u ON u.id = m.other_id
    ORDER BY m.last_message_time DESC
  `;
  
  const result = await db.prepare(query).bind(userId, userId, userId).all();
  return result.results;
}

export async function getNotifications(db: D1Database, userId: number, unreadOnly = false) {
  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  const params: any[] = [userId];
  
  if (unreadOnly) {
    query += ' AND read_status = 0';
  }
  
  query += ' ORDER BY created_at DESC LIMIT 50';
  
  const result = await db.prepare(query).bind(...params).all();
  return result.results;
}

export async function createNotification(
  db: D1Database,
  userId: number,
  type: string,
  title: string,
  content: string,
  relatedUserId?: number
) {
  const result = await db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_user_id)
    VALUES (?, ?, ?, ?, ?)
  `).bind(userId, type, title, content, relatedUserId || null).run();
  
  return result.success;
}

export async function getPotentialMatches(db: D1Database, userId: number, limit = 20) {
  // Get user preferences
  const user = await getUserById(db, userId);
  if (!user) return [];
  
  const prefsResult = await db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').bind(userId).first();
  
  // Get users not already matched
  const query = `
    SELECT u.*, 
           (SELECT COUNT(*) FROM user_media WHERE user_id = u.id AND type = 'photo' AND status = 'approved') as photo_count
    FROM users u
    WHERE u.id != ?
      AND u.status = 'active'
      AND u.verified = 1
      AND u.admin_approved = 1
      AND u.id NOT IN (
        SELECT CASE 
          WHEN user1_id = ? THEN user2_id 
          ELSE user1_id 
        END
        FROM matches
        WHERE (user1_id = ? OR user2_id = ?)
      )
    ORDER BY RANDOM()
    LIMIT ?
  `;
  
  const result = await db.prepare(query).bind(userId, userId, userId, userId, limit).all();
  return result.results;
}

export async function calculateAge(birthDate: string): Promise<number> {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Calculate match score based on preferences and user attributes
export function calculateMatchScore(user1: any, user2: any, prefs1: any, prefs2: any): number {
  let score = 0.5; // Base score
  
  // Check age preferences
  if (prefs1 && user2.birth_date) {
    const age2 = new Date().getFullYear() - new Date(user2.birth_date).getFullYear();
    if (age2 >= prefs1.min_age && age2 <= prefs1.max_age) {
      score += 0.1;
    }
  }
  
  if (prefs2 && user1.birth_date) {
    const age1 = new Date().getFullYear() - new Date(user1.birth_date).getFullYear();
    if (age1 >= prefs2.min_age && age1 <= prefs2.max_age) {
      score += 0.1;
    }
  }
  
  // Check language compatibility
  if (user1.language && user2.language && user1.language === user2.language) {
    score += 0.1;
  }
  
  // Check interests overlap
  if (user1.interests && user2.interests) {
    try {
      const interests1 = JSON.parse(user1.interests);
      const interests2 = JSON.parse(user2.interests);
      const common = interests1.filter((i: string) => interests2.includes(i));
      score += (common.length / Math.max(interests1.length, interests2.length)) * 0.2;
    } catch (e) {
      // Skip if JSON parsing fails
    }
  }
  
  return Math.min(score, 1.0); // Cap at 1.0
}
