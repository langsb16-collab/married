// Messaging routes with translation support
import { Hono } from 'hono';
import type { Bindings, ApiResponse } from '../types';
import { getMessages, getConversations, getUserById, createNotification } from '../utils/db';

const messages = new Hono<{ Bindings: Bindings }>();

// Get conversations list
messages.get('/conversations/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'));
  const { DB } = c.env;
  
  try {
    const conversations = await getConversations(DB, userId);
    
    return c.json<ApiResponse>({
      success: true,
      data: conversations
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Get messages between two users
messages.get('/:userId/with/:otherUserId', async (c) => {
  const userId = parseInt(c.req.param('userId'));
  const otherUserId = parseInt(c.req.param('otherUserId'));
  const { DB } = c.env;
  const limit = parseInt(c.req.query('limit') || '50');
  
  try {
    const messageList = await getMessages(DB, userId, otherUserId, limit);
    
    // Mark messages as read
    await DB.prepare(`
      UPDATE messages 
      SET read_status = 1, read_at = CURRENT_TIMESTAMP 
      WHERE sender_id = ? AND receiver_id = ? AND read_status = 0
    `).bind(otherUserId, userId).run();
    
    return c.json<ApiResponse>({
      success: true,
      data: messageList
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Send a message (with auto-translation)
messages.post('/', async (c) => {
  const { DB } = c.env;
  
  try {
    const { sender_id, receiver_id, text, type, media_url } = await c.req.json();
    
    if (!sender_id || !receiver_id || !text) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'sender_id, receiver_id, and text are required' 
      }, 400);
    }
    
    // Get users to determine languages
    const [sender, receiver] = await Promise.all([
      getUserById(DB, sender_id),
      getUserById(DB, receiver_id)
    ]);
    
    if (!sender || !receiver) {
      return c.json<ApiResponse>({ success: false, error: 'User not found' }, 404);
    }
    
    // In production, this would call a translation API (Google Translate, DeepL, etc.)
    // For now, we'll store the original and indicate translation is needed
    let translatedText = text;
    let translatedLanguage = receiver.language;
    
    // Simulate translation if languages differ
    if (sender.language !== receiver.language) {
      // In real implementation, call translation API here
      translatedText = `[Translated to ${receiver.language}] ${text}`;
    }
    
    // Insert message
    const result = await DB.prepare(`
      INSERT INTO messages (sender_id, receiver_id, original_text, original_language, translated_text, translated_language, type, media_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sender_id,
      receiver_id,
      text,
      sender.language,
      translatedText,
      translatedLanguage,
      type || 'text',
      media_url || null
    ).run();
    
    // Create notification for receiver
    await createNotification(
      DB,
      receiver_id,
      'message',
      'New Message',
      `${sender.name} sent you a message`,
      sender_id
    );
    
    // Get the created message
    const newMessage = await DB.prepare(
      'SELECT * FROM messages WHERE id = ?'
    ).bind(result.meta.last_row_id).first();
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: newMessage,
      message: 'Message sent successfully' 
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Translate a message on demand (WeChat style)
messages.post('/translate', async (c) => {
  const { DB } = c.env;
  
  try {
    const { message_id, target_language } = await c.req.json();
    
    if (!message_id || !target_language) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'message_id and target_language are required' 
      }, 400);
    }
    
    // Get message
    const message = await DB.prepare(
      'SELECT * FROM messages WHERE id = ?'
    ).bind(message_id).first<any>();
    
    if (!message) {
      return c.json<ApiResponse>({ success: false, error: 'Message not found' }, 404);
    }
    
    // In production, call translation API
    // For now, simulate translation
    const translatedText = `[Translated to ${target_language}] ${message.original_text}`;
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        original_text: message.original_text,
        original_language: message.original_language,
        translated_text: translatedText,
        target_language: target_language
      }
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Delete a message
messages.delete('/:messageId', async (c) => {
  const messageId = parseInt(c.req.param('messageId'));
  const { DB } = c.env;
  
  try {
    const { user_id } = await c.req.query();
    
    // Get message
    const message = await DB.prepare(
      'SELECT * FROM messages WHERE id = ?'
    ).bind(messageId).first<any>();
    
    if (!message) {
      return c.json<ApiResponse>({ success: false, error: 'Message not found' }, 404);
    }
    
    // Verify user is sender
    if (message.sender_id !== parseInt(user_id)) {
      return c.json<ApiResponse>({ success: false, error: 'Unauthorized' }, 403);
    }
    
    // Delete message
    await DB.prepare('DELETE FROM messages WHERE id = ?').bind(messageId).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'Message deleted successfully' 
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// Get unread message count
messages.get('/unread/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'));
  const { DB } = c.env;
  
  try {
    const result = await DB.prepare(`
      SELECT COUNT(*) as unread_count
      FROM messages
      WHERE receiver_id = ? AND read_status = 0
    `).bind(userId).first<{ unread_count: number }>();
    
    return c.json<ApiResponse>({
      success: true,
      data: { unread_count: result?.unread_count || 0 }
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

export default messages;
