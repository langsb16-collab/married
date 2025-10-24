// User profile routes
import { Hono } from 'hono';
import type { Bindings, ApiResponse, User } from '../types';
import { getUserById, getUserByEmail, getSocialVerifications, getUserMedia } from '../utils/db';

const users = new Hono<{ Bindings: Bindings }>();

// Get user profile by ID
users.get('/:id', async (c) => {
  const userId = parseInt(c.req.param('id'));
  const { DB } = c.env;
  
  try {
    const user = await getUserById(DB, userId);
    
    if (!user) {
      return c.json<ApiResponse>({ success: false, error: 'User not found' }, 404);
    }
    
    // Get additional user data
    const [socialVerifications, media] = await Promise.all([
      getSocialVerifications(DB, userId),
      getUserMedia(DB, userId)
    ]);
    
    // Don't return sensitive data
    const { password_hash, ...safeUser } = user as any;
    
    // Calculate age if birth_date exists
    let age = null;
    if (user.birth_date) {
      const birthDate = new Date(user.birth_date);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    return c.json<ApiResponse>({
      success: true,
      data: {
        ...safeUser,
        age,
        social_verifications: socialVerifications,
        media: media
      }
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Update user profile
users.put('/:id', async (c) => {
  const userId = parseInt(c.req.param('id'));
  const { DB } = c.env;
  
  try {
    const body = await c.req.json();
    const { name, gender, birth_date, country, city, language, bio, interests, mbti } = body;
    
    // Validate user exists
    const user = await getUserById(DB, userId);
    if (!user) {
      return c.json<ApiResponse>({ success: false, error: 'User not found' }, 404);
    }
    
    // Update user
    const result = await DB.prepare(`
      UPDATE users 
      SET name = ?, gender = ?, birth_date = ?, country = ?, city = ?, 
          language = ?, bio = ?, interests = ?, mbti = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name || user.name,
      gender || user.gender,
      birth_date || user.birth_date,
      country || user.country,
      city || user.city,
      language || user.language,
      bio || user.bio,
      interests || user.interests,
      mbti || user.mbti,
      userId
    ).run();
    
    if (result.success) {
      const updatedUser = await getUserById(DB, userId);
      return c.json<ApiResponse>({ 
        success: true, 
        data: updatedUser,
        message: 'Profile updated successfully' 
      });
    }
    
    return c.json<ApiResponse>({ success: false, error: 'Failed to update profile' }, 500);
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Get user's social verifications
users.get('/:id/verifications', async (c) => {
  const userId = parseInt(c.req.param('id'));
  const { DB } = c.env;
  
  try {
    const verifications = await getSocialVerifications(DB, userId);
    
    return c.json<ApiResponse>({
      success: true,
      data: verifications
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Add social verification (OAuth callback would set this)
users.post('/:id/verifications', async (c) => {
  const userId = parseInt(c.req.param('id'));
  const { DB } = c.env;
  
  try {
    const { provider, provider_id, provider_username } = await c.req.json();
    
    // Validate provider
    const validProviders = ['facebook', 'instagram', 'kakao', 'x', 'naver', 'google', 'wechat'];
    if (!validProviders.includes(provider)) {
      return c.json<ApiResponse>({ success: false, error: 'Invalid provider' }, 400);
    }
    
    // Check if verification already exists
    const existing = await DB.prepare(
      'SELECT * FROM social_verifications WHERE user_id = ? AND provider = ?'
    ).bind(userId, provider).first();
    
    if (existing) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'This social media account is already verified' 
      }, 400);
    }
    
    // Add verification
    await DB.prepare(`
      INSERT INTO social_verifications (user_id, provider, provider_id, provider_username)
      VALUES (?, ?, ?, ?)
    `).bind(userId, provider, provider_id, provider_username || null).run();
    
    // Update verification count
    const countResult = await DB.prepare(
      'SELECT COUNT(*) as count FROM social_verifications WHERE user_id = ?'
    ).bind(userId).first<{ count: number }>();
    
    const verificationCount = countResult?.count || 0;
    const isVerified = verificationCount >= 3 ? 1 : 0;
    
    await DB.prepare(`
      UPDATE users 
      SET verification_count = ?, verified = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(verificationCount, isVerified, userId).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: { verification_count: verificationCount, verified: isVerified },
      message: isVerified 
        ? 'Congratulations! You are now a verified member!' 
        : `Verification added. ${3 - verificationCount} more needed for full verification.`
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Get user media (photos/videos)
users.get('/:id/media', async (c) => {
  const userId = parseInt(c.req.param('id'));
  const { DB } = c.env;
  const type = c.req.query('type') as 'photo' | 'video' | 'story' | undefined;
  
  try {
    const media = await getUserMedia(DB, userId, type);
    
    return c.json<ApiResponse>({
      success: true,
      data: media
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Upload user media (in production, this would upload to R2/S3)
users.post('/:id/media', async (c) => {
  const userId = parseInt(c.req.param('id'));
  const { DB } = c.env;
  
  try {
    const { type, url, thumbnail_url, is_profile } = await c.req.json();
    
    // Validate type
    const validTypes = ['photo', 'video', 'story'];
    if (!validTypes.includes(type)) {
      return c.json<ApiResponse>({ success: false, error: 'Invalid media type' }, 400);
    }
    
    // Check media count limits
    const existingMedia = await DB.prepare(
      'SELECT COUNT(*) as count FROM user_media WHERE user_id = ? AND type = ? AND status != ?'
    ).bind(userId, type, 'rejected').first<{ count: number }>();
    
    const maxPhotos = 10;
    const maxVideos = 3;
    
    if (type === 'photo' && (existingMedia?.count || 0) >= maxPhotos) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: `Maximum ${maxPhotos} photos allowed` 
      }, 400);
    }
    
    if (type === 'video' && (existingMedia?.count || 0) >= maxVideos) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: `Maximum ${maxVideos} videos allowed` 
      }, 400);
    }
    
    // Set expires_at for stories (24 hours)
    let expires_at = null;
    if (type === 'story') {
      const now = new Date();
      now.setHours(now.getHours() + 24);
      expires_at = now.toISOString();
    }
    
    // Insert media
    const result = await DB.prepare(`
      INSERT INTO user_media (user_id, type, url, thumbnail_url, is_profile, status, expires_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      userId, 
      type, 
      url, 
      thumbnail_url || null, 
      is_profile ? 1 : 0,
      expires_at
    ).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: { id: result.meta.last_row_id },
      message: 'Media uploaded successfully. Pending admin approval.' 
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Search users
users.get('/search', async (c) => {
  const { DB } = c.env;
  const query = c.req.query('q');
  const country = c.req.query('country');
  const language = c.req.query('language');
  const gender = c.req.query('gender');
  
  try {
    let sql = `
      SELECT u.id, u.name, u.gender, u.country, u.language, u.bio, u.verified, u.verification_count
      FROM users u
      WHERE u.status = 'active' AND u.admin_approved = 1
    `;
    
    const params: any[] = [];
    
    if (query) {
      sql += ' AND (u.name LIKE ? OR u.bio LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }
    
    if (country) {
      sql += ' AND u.country = ?';
      params.push(country);
    }
    
    if (language) {
      sql += ' AND u.language = ?';
      params.push(language);
    }
    
    if (gender) {
      sql += ' AND u.gender = ?';
      params.push(gender);
    }
    
    sql += ' LIMIT 50';
    
    const result = await DB.prepare(sql).bind(...params).all();
    
    return c.json<ApiResponse>({
      success: true,
      data: result.results
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

export default users;
