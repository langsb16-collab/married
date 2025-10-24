// Matching routes
import { Hono } from 'hono';
import type { Bindings, ApiResponse } from '../types';
import { getMatches, getPotentialMatches, getUserById, calculateMatchScore, createNotification } from '../utils/db';

const matches = new Hono<{ Bindings: Bindings }>();

// Get user's matches
matches.get('/user/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'));
  const { DB } = c.env;
  const status = c.req.query('status'); // accepted, pending, rejected
  
  try {
    const matchList = await getMatches(DB, userId, status);
    
    return c.json<ApiResponse>({
      success: true,
      data: matchList
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Get potential matches (discovery feed)
matches.get('/discover/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'));
  const { DB } = c.env;
  const limit = parseInt(c.req.query('limit') || '20');
  
  try {
    const potentialMatches = await getPotentialMatches(DB, userId, limit);
    
    // Enrich with media information
    const enrichedMatches = await Promise.all(
      potentialMatches.map(async (user: any) => {
        const photos = await DB.prepare(`
          SELECT url, thumbnail_url FROM user_media 
          WHERE user_id = ? AND type = 'photo' AND status = 'approved' 
          ORDER BY is_profile DESC, display_order ASC
          LIMIT 5
        `).bind(user.id).all();
        
        // Calculate age
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
        
        return {
          ...user,
          age,
          photos: photos.results
        };
      })
    );
    
    return c.json<ApiResponse>({
      success: true,
      data: enrichedMatches
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Create a match (like someone)
matches.post('/', async (c) => {
  const { DB } = c.env;
  
  try {
    const { user1_id, user2_id } = await c.req.json();
    
    if (!user1_id || !user2_id) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Both user1_id and user2_id are required' 
      }, 400);
    }
    
    // Check if users exist
    const [user1, user2] = await Promise.all([
      getUserById(DB, user1_id),
      getUserById(DB, user2_id)
    ]);
    
    if (!user1 || !user2) {
      return c.json<ApiResponse>({ success: false, error: 'User not found' }, 404);
    }
    
    // Check if match already exists
    const existingMatch = await DB.prepare(`
      SELECT * FROM matches 
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `).bind(user1_id, user2_id, user2_id, user1_id).first();
    
    if (existingMatch) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Match already exists',
        data: existingMatch
      }, 400);
    }
    
    // Get user preferences for score calculation
    const [prefs1, prefs2] = await Promise.all([
      DB.prepare('SELECT * FROM user_preferences WHERE user_id = ?').bind(user1_id).first(),
      DB.prepare('SELECT * FROM user_preferences WHERE user_id = ?').bind(user2_id).first()
    ]);
    
    // Calculate match score
    const matchScore = calculateMatchScore(user1, user2, prefs1, prefs2);
    
    // Create match
    const result = await DB.prepare(`
      INSERT INTO matches (user1_id, user2_id, match_score, match_type, status, initiated_by)
      VALUES (?, ?, ?, 'manual', 'pending', ?)
    `).bind(user1_id, user2_id, matchScore, user1_id).run();
    
    // Create notification for user2
    await createNotification(
      DB,
      user2_id,
      'match',
      'New Match Request',
      `${user1.name} wants to connect with you!`,
      user1_id
    );
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: { 
        id: result.meta.last_row_id,
        match_score: matchScore,
        status: 'pending'
      },
      message: 'Match request sent!' 
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Respond to match (accept/reject)
matches.put('/:matchId/respond', async (c) => {
  const matchId = parseInt(c.req.param('matchId'));
  const { DB } = c.env;
  
  try {
    const { user_id, action } = await c.req.json(); // action: 'accept' or 'reject'
    
    if (!action || !['accept', 'reject'].includes(action)) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Invalid action. Must be "accept" or "reject"' 
      }, 400);
    }
    
    // Get match
    const match = await DB.prepare('SELECT * FROM matches WHERE id = ?').bind(matchId).first<any>();
    
    if (!match) {
      return c.json<ApiResponse>({ success: false, error: 'Match not found' }, 404);
    }
    
    // Verify user is part of this match
    if (match.user1_id !== user_id && match.user2_id !== user_id) {
      return c.json<ApiResponse>({ success: false, error: 'Unauthorized' }, 403);
    }
    
    // Update match status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await DB.prepare(`
      UPDATE matches SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(newStatus, matchId).run();
    
    // If accepted, create notification for the other user
    if (action === 'accept') {
      const otherUserId = match.user1_id === user_id ? match.user2_id : match.user1_id;
      const currentUser = await getUserById(DB, user_id);
      
      await createNotification(
        DB,
        otherUserId,
        'match',
        "It's a Match!",
        `${currentUser?.name} accepted your match request!`,
        user_id
      );
    }
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: action === 'accept' ? "It's a match!" : 'Match rejected',
      data: { status: newStatus }
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Unmatch / block
matches.delete('/:matchId', async (c) => {
  const matchId = parseInt(c.req.param('matchId'));
  const { DB } = c.env;
  
  try {
    const { user_id } = await c.req.query();
    
    // Get match
    const match = await DB.prepare('SELECT * FROM matches WHERE id = ?').bind(matchId).first<any>();
    
    if (!match) {
      return c.json<ApiResponse>({ success: false, error: 'Match not found' }, 404);
    }
    
    // Verify user is part of this match
    if (match.user1_id !== parseInt(user_id) && match.user2_id !== parseInt(user_id)) {
      return c.json<ApiResponse>({ success: false, error: 'Unauthorized' }, 403);
    }
    
    // Delete match
    await DB.prepare('DELETE FROM matches WHERE id = ?').bind(matchId).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'Match removed successfully' 
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Get match statistics
matches.get('/stats/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'));
  const { DB } = c.env;
  
  try {
    const stats = await DB.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_matches,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_matches,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_matches,
        COUNT(*) as total_matches
      FROM matches
      WHERE user1_id = ? OR user2_id = ?
    `).bind(userId, userId).first();
    
    return c.json<ApiResponse>({
      success: true,
      data: stats
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

export default matches;
