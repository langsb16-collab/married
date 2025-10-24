import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';

// Import routes
import users from './routes/users';
import matches from './routes/matches';
import messages from './routes/messages';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// API Routes
app.route('/api/users', users);
app.route('/api/matches', matches);
app.route('/api/messages', messages);

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    success: true, 
    message: 'Global Dating Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// Get available gifts
app.get('/api/gifts', async (c) => {
  const { DB } = c.env;
  
  try {
    const result = await DB.prepare('SELECT * FROM gifts ORDER BY cost_points ASC').all();
    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Send a gift
app.post('/api/gifts/send', async (c) => {
  const { DB } = c.env;
  
  try {
    const { gift_id, sender_id, receiver_id, message } = await c.req.json();
    
    // Get gift details
    const gift = await DB.prepare('SELECT * FROM gifts WHERE id = ?').bind(gift_id).first<any>();
    if (!gift) {
      return c.json({ success: false, error: 'Gift not found' }, 404);
    }
    
    // Check sender has enough points
    const sender = await DB.prepare('SELECT points FROM users WHERE id = ?').bind(sender_id).first<any>();
    if (!sender || sender.points < gift.cost_points) {
      return c.json({ success: false, error: 'Insufficient points' }, 400);
    }
    
    // Deduct points from sender
    await DB.prepare('UPDATE users SET points = points - ? WHERE id = ?').bind(gift.cost_points, sender_id).run();
    
    // Record transaction
    await DB.prepare(`
      INSERT INTO gift_transactions (gift_id, sender_id, receiver_id, message)
      VALUES (?, ?, ?, ?)
    `).bind(gift_id, sender_id, receiver_id, message || null).run();
    
    // Create notification
    const senderUser = await DB.prepare('SELECT name FROM users WHERE id = ?').bind(sender_id).first<any>();
    await DB.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_user_id)
      VALUES (?, 'gift', 'New Gift!', ?, ?)
    `).bind(receiver_id, `${senderUser.name} sent you a ${gift.name}!`, sender_id).run();
    
    return c.json({ success: true, message: 'Gift sent successfully!' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get notifications
app.get('/api/notifications/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'));
  const { DB } = c.env;
  
  try {
    const result = await DB.prepare(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `).bind(userId).all();
    
    return c.json({ success: true, data: result.results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', async (c) => {
  const notificationId = parseInt(c.req.param('notificationId'));
  const { DB } = c.env;
  
  try {
    await DB.prepare(`
      UPDATE notifications SET read_status = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(notificationId).run();
    
    return c.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Main page
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Global Love Bridge - 글로벌 연애 매칭 플랫폼</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <!-- Modern Fonts for Young Generation -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Noto+Sans+KR:wght@300;400;500;700;900&family=Noto+Sans+JP:wght@300;400;500;700;900&family=Noto+Sans+SC:wght@300;400;500;700;900&family=Noto+Sans+Arabic:wght@300;400;500;700;900&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Poppins', 'Noto Sans KR', 'Noto Sans JP', 'Noto Sans SC', 'Noto Sans Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            letter-spacing: -0.02em;
        }
        
        /* Korean */
        html[lang="ko"] body {
            font-family: 'Noto Sans KR', 'Poppins', sans-serif;
        }
        
        /* Japanese */
        html[lang="ja"] body {
            font-family: 'Noto Sans JP', 'Poppins', sans-serif;
        }
        
        /* Chinese */
        html[lang="zh"] body {
            font-family: 'Noto Sans SC', 'Poppins', sans-serif;
        }
        
        /* Arabic */
        html[lang="ar"] body {
            font-family: 'Noto Sans Arabic', 'Poppins', sans-serif;
        }
        
        /* English and others */
        html[lang="en"] body,
        html[lang="vi"] body,
        html[lang="es"] body {
            font-family: 'Poppins', sans-serif;
        }
        
        h1, h2, h3, h4, h5, h6 {
            font-weight: 700;
            letter-spacing: -0.03em;
        }
        
        .hero-title {
            font-weight: 800;
            letter-spacing: -0.04em;
        }
        
        .modern-text {
            font-weight: 500;
        }
        
        .bold-text {
            font-weight: 700;
        }
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .card-hover:hover {
            transform: translateY(-5px);
            transition: all 0.3s ease;
        }
        .rtl-support[dir="rtl"] {
            direction: rtl;
        }
        
        /* Romantic Sky Background with Moving Clouds */
        .romantic-sky {
            background: linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #B0E5FF 100%);
            position: relative;
            overflow: hidden;
            min-height: 100vh;
        }
        
        .cloud {
            position: absolute;
            background: white;
            border-radius: 100px;
            opacity: 0.7;
            animation: float 60s infinite linear;
        }
        
        .cloud::before,
        .cloud::after {
            content: '';
            position: absolute;
            background: white;
            border-radius: 100px;
        }
        
        .cloud-1 {
            width: 100px;
            height: 40px;
            top: 10%;
            left: -100px;
            animation-duration: 45s;
        }
        
        .cloud-1::before {
            width: 50px;
            height: 50px;
            top: -25px;
            left: 10px;
        }
        
        .cloud-1::after {
            width: 60px;
            height: 40px;
            top: -15px;
            right: 10px;
        }
        
        .cloud-2 {
            width: 120px;
            height: 50px;
            top: 25%;
            left: -120px;
            animation-duration: 55s;
            animation-delay: 10s;
        }
        
        .cloud-2::before {
            width: 60px;
            height: 60px;
            top: -30px;
            left: 15px;
        }
        
        .cloud-2::after {
            width: 70px;
            height: 50px;
            top: -20px;
            right: 15px;
        }
        
        .cloud-3 {
            width: 90px;
            height: 35px;
            top: 60%;
            left: -90px;
            animation-duration: 50s;
            animation-delay: 20s;
        }
        
        .cloud-3::before {
            width: 45px;
            height: 45px;
            top: -20px;
            left: 8px;
        }
        
        .cloud-3::after {
            width: 55px;
            height: 35px;
            top: -12px;
            right: 8px;
        }
        
        .cloud-4 {
            width: 110px;
            height: 45px;
            top: 80%;
            left: -110px;
            animation-duration: 48s;
            animation-delay: 5s;
        }
        
        .cloud-4::before {
            width: 55px;
            height: 55px;
            top: -28px;
            left: 12px;
        }
        
        .cloud-4::after {
            width: 65px;
            height: 45px;
            top: -18px;
            right: 12px;
        }
        
        @keyframes float {
            from {
                transform: translateX(0);
            }
            to {
                transform: translateX(calc(100vw + 200px));
            }
        }
        
        .requirements-box {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 3px solid #667eea;
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
            animation: pulse-border 2s ease-in-out infinite;
        }
        
        @keyframes pulse-border {
            0%, 100% {
                box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
            }
            50% {
                box-shadow: 0 10px 50px rgba(102, 126, 234, 0.5);
            }
        }
        
        .benefit-badge {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            animation: shine 3s ease-in-out infinite;
        }
        
        @keyframes shine {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            }
            50% {
                transform: scale(1.05);
                box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
            }
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="gradient-bg text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <i class="fas fa-heart text-2xl mr-3"></i>
                    <span class="text-xl font-bold" id="app-title">Global Love Bridge</span>
                </div>
                
                <!-- Language Selector -->
                <div class="flex items-center space-x-4">
                    <select id="language-selector" class="bg-white/20 text-white border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50">
                        <option value="ko">🇰🇷 한국어</option>
                        <option value="en" selected>🇺🇸 English</option>
                        <option value="zh">🇨🇳 中文</option>
                        <option value="ja">🇯🇵 日本語</option>
                        <option value="vi">🇻🇳 Tiếng Việt</option>
                        <option value="es">🇪🇸 Español</option>
                        <option value="ar">🇸🇦 العربية</option>
                    </select>
                    <button class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                        <span id="nav-login">Login</span>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section with Romantic Sky -->
    <div class="romantic-sky py-20">
        <!-- Animated Clouds -->
        <div class="cloud cloud-1"></div>
        <div class="cloud cloud-2"></div>
        <div class="cloud cloud-3"></div>
        <div class="cloud cloud-4"></div>
        
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 class="text-5xl md:text-6xl hero-title mb-6 text-purple-900" id="hero-title">Find Love Across Borders</h1>
            <p class="text-xl md:text-2xl modern-text mb-8 text-purple-700" id="hero-subtitle">Connect with verified singles from around the world. Start your international love story today.</p>
            
            <!-- Requirements Box -->
            <div class="requirements-box max-w-4xl mx-auto rounded-2xl p-8 mb-8">
                <div class="flex items-center justify-center mb-6">
                    <div class="benefit-badge text-white px-6 py-3 rounded-full bold-text text-lg">
                        <i class="fas fa-star mr-2"></i>
                        <span id="badge-strict">Strict Verification = 100% Free Benefits!</span>
                    </div>
                </div>
                
                <h3 class="text-2xl md:text-3xl hero-title text-purple-900 mb-6" id="requirements-title">Profile Requirements for Approval</h3>
                
                <div class="grid md:grid-cols-2 gap-6 text-left">
                    <!-- Photos Required -->
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <h4 class="bold-text text-lg text-purple-900 mb-3 flex items-center">
                            <i class="fas fa-camera text-purple-600 mr-2"></i>
                            <span id="req-photos-title">Required Photos</span>
                        </h4>
                        <ul class="space-y-2 text-gray-700 modern-text">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-green-600 mt-1 mr-2"></i>
                                <span id="req-face">3 Face Photos (Clear, Front-facing)</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-green-600 mt-1 mr-2"></i>
                                <span id="req-full">3 Full-Body Photos</span>
                            </li>
                        </ul>
                    </div>
                    
                    <!-- Info Required -->
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <h4 class="bold-text text-lg text-purple-900 mb-3 flex items-center">
                            <i class="fas fa-info-circle text-purple-600 mr-2"></i>
                            <span id="req-info-title">Required Information</span>
                        </h4>
                        <ul class="space-y-2 text-gray-700 modern-text">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-green-600 mt-1 mr-2"></i>
                                <span id="req-job">Occupation / Job</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-green-600 mt-1 mr-2"></i>
                                <span id="req-edu">Education Level</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-green-600 mt-1 mr-2"></i>
                                <span id="req-hometown">Hometown / Origin</span>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <!-- Social Media Verification -->
                <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h4 class="bold-text text-lg text-purple-900 mb-3 flex items-center justify-center">
                        <i class="fas fa-shield-check text-blue-600 mr-2"></i>
                        <span id="req-social-title">3+ Social Media Accounts Required</span>
                    </h4>
                    <div class="flex justify-center space-x-4 text-3xl">
                        <i class="fab fa-facebook text-blue-600"></i>
                        <i class="fab fa-instagram text-pink-600"></i>
                        <i class="fab fa-x-twitter text-gray-800"></i>
                        <i class="fas fa-comment text-yellow-500"></i>
                        <i class="fab fa-weixin text-green-600"></i>
                    </div>
                    <p class="text-center text-gray-600 mt-3 modern-text" id="req-social-desc">Facebook, Instagram, KakaoTalk, X (Twitter), Naver, WeChat</p>
                </div>
                
                <!-- Benefits Highlight -->
                <div class="mt-6 bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-lg border-2 border-yellow-400">
                    <h4 class="hero-title text-orange-900 mb-3 text-xl flex items-center justify-center">
                        <i class="fas fa-gift text-orange-600 mr-2"></i>
                        <span id="benefits-title">100% FREE Benefits After Approval!</span>
                    </h4>
                    <div class="grid md:grid-cols-3 gap-4 text-center">
                        <div>
                            <i class="fas fa-infinity text-purple-600 text-2xl mb-2"></i>
                            <p class="bold-text text-gray-800" id="benefit-1">Unlimited Messaging</p>
                        </div>
                        <div>
                            <i class="fas fa-language text-blue-600 text-2xl mb-2"></i>
                            <p class="bold-text text-gray-800" id="benefit-2">Auto Translation</p>
                        </div>
                        <div>
                            <i class="fas fa-video text-green-600 text-2xl mb-2"></i>
                            <p class="bold-text text-gray-800" id="benefit-3">Video Chat</p>
                        </div>
                    </div>
                </div>
                
                <!-- Emphasis Message -->
                <div class="mt-6 text-center">
                    <p class="text-lg md:text-xl hero-title text-purple-900 mb-2" id="emphasis-title">
                        <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                        <span id="emphasis-text">Strict Verification Process, but 100% Free Forever!</span>
                    </p>
                    <p class="text-gray-600 modern-text" id="emphasis-subtitle">Quality over quantity. Meet verified, serious singles only.</p>
                </div>
            </div>
            
            <div class="flex justify-center space-x-4">
                <button class="bg-purple-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-700 transition shadow-2xl transform hover:scale-105">
                    <i class="fas fa-user-plus mr-2"></i>
                    <span id="hero-signup">Sign Up Free Now</span>
                </button>
                <button class="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-2xl transform hover:scale-105">
                    <i class="fas fa-search mr-2"></i>
                    <span id="hero-browse">Browse Profiles</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Features Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 class="text-3xl font-bold text-center mb-12" id="features-title">Why Choose Global Love Bridge?</h2>
        
        <div class="grid md:grid-cols-3 gap-8">
            <!-- Feature 1 -->
            <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                <div class="text-purple-600 text-4xl mb-4">
                    <i class="fas fa-shield-check"></i>
                </div>
                <h3 class="text-xl font-semibold mb-2" id="feature1-title">Verified Members Only</h3>
                <p class="text-gray-600" id="feature1-desc">All members verified through 3+ social media accounts for your safety and trust.</p>
            </div>
            
            <!-- Feature 2 -->
            <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                <div class="text-purple-600 text-4xl mb-4">
                    <i class="fas fa-language"></i>
                </div>
                <h3 class="text-xl font-semibold mb-2" id="feature2-title">Real-time Translation</h3>
                <p class="text-gray-600" id="feature2-desc">Chat in your language with automatic translation in 7 languages. No barriers!</p>
            </div>
            
            <!-- Feature 3 -->
            <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                <div class="text-purple-600 text-4xl mb-4">
                    <i class="fas fa-video"></i>
                </div>
                <h3 class="text-xl font-semibold mb-2" id="feature3-title">Video Chat</h3>
                <p class="text-gray-600" id="feature3-desc">See your match face-to-face with HD video chat and real-time translation subtitles.</p>
            </div>
            
            <!-- Feature 4 -->
            <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                <div class="text-purple-600 text-4xl mb-4">
                    <i class="fas fa-brain"></i>
                </div>
                <h3 class="text-xl font-semibold mb-2" id="feature4-title">AI Matching</h3>
                <p class="text-gray-600" id="feature4-desc">Our AI algorithm finds your perfect match based on interests, values, and preferences.</p>
            </div>
            
            <!-- Feature 5 -->
            <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                <div class="text-purple-600 text-4xl mb-4">
                    <i class="fas fa-globe"></i>
                </div>
                <h3 class="text-xl font-semibold mb-2" id="feature5-title">Global Community</h3>
                <p class="text-gray-600" id="feature5-desc">Members from 100+ countries looking for meaningful international relationships.</p>
            </div>
            
            <!-- Feature 6 -->
            <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                <div class="text-purple-600 text-4xl mb-4">
                    <i class="fas fa-gift"></i>
                </div>
                <h3 class="text-xl font-semibold mb-2" id="feature6-title">Send Virtual Gifts</h3>
                <p class="text-gray-600" id="feature6-desc">Express your feelings with virtual gifts, roses, hearts, and more!</p>
            </div>
        </div>
    </div>

    <!-- How It Works -->
    <div class="bg-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="text-3xl font-bold text-center mb-12" id="how-title">How It Works</h2>
            
            <div class="grid md:grid-cols-4 gap-8">
                <div class="text-center">
                    <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-2xl font-bold text-purple-600">1</span>
                    </div>
                    <h3 class="font-semibold mb-2" id="step1-title">Sign Up</h3>
                    <p class="text-sm text-gray-600" id="step1-desc">Create account with 3+ social media verifications</p>
                </div>
                
                <div class="text-center">
                    <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-2xl font-bold text-purple-600">2</span>
                    </div>
                    <h3 class="font-semibold mb-2" id="step2-title">Create Profile</h3>
                    <p class="text-sm text-gray-600" id="step2-desc">Add photos, videos, and tell your story</p>
                </div>
                
                <div class="text-center">
                    <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-2xl font-bold text-purple-600">3</span>
                    </div>
                    <h3 class="font-semibold mb-2" id="step3-title">Get Matched</h3>
                    <p class="text-sm text-gray-600" id="step3-desc">AI finds your perfect match based on compatibility</p>
                </div>
                
                <div class="text-center">
                    <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-2xl font-bold text-purple-600">4</span>
                    </div>
                    <h3 class="font-semibold mb-2" id="step4-title">Start Dating</h3>
                    <p class="text-sm text-gray-600" id="step4-desc">Chat, video call, and build your relationship</p>
                </div>
            </div>
        </div>
    </div>

    <!-- CTA Section -->
    <div class="gradient-bg text-white py-16">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="text-4xl font-bold mb-4" id="cta-title">Ready to Find Your Perfect Match?</h2>
            <p class="text-xl mb-8 opacity-90" id="cta-subtitle">Join thousands of singles finding love across borders</p>
            <button class="bg-white text-purple-600 px-12 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-xl">
                <span id="cta-button">Get Started - It's Free!</span>
            </button>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid md:grid-cols-4 gap-8 mb-8">
                <div>
                    <h4 class="font-bold mb-4">About</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#" class="hover:text-white">About Us</a></li>
                        <li><a href="#" class="hover:text-white">How It Works</a></li>
                        <li><a href="#" class="hover:text-white">Success Stories</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4">Support</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#" class="hover:text-white">Help Center</a></li>
                        <li><a href="#" class="hover:text-white">Safety Tips</a></li>
                        <li><a href="#" class="hover:text-white">Contact Us</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4">Legal</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#" class="hover:text-white">Privacy Policy</a></li>
                        <li><a href="#" class="hover:text-white">Terms of Service</a></li>
                        <li><a href="#" class="hover:text-white">Cookie Policy</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4">Follow Us</h4>
                    <div class="flex space-x-4 text-2xl">
                        <a href="#" class="hover:text-purple-400"><i class="fab fa-facebook"></i></a>
                        <a href="#" class="hover:text-purple-400"><i class="fab fa-instagram"></i></a>
                        <a href="#" class="hover:text-purple-400"><i class="fab fa-twitter"></i></a>
                    </div>
                </div>
            </div>
            <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
                <p>&copy; 2024 Global Love Bridge. All rights reserved. | Powered by Cloudflare Pages</p>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // Translation system
        const translations = {
            ko: {
                appTitle: 'Global Love Bridge',
                heroTitle: '국경을 넘어 사랑을 찾아보세요',
                heroSubtitle: '전 세계 인증된 싱글들과 연결하세요. 오늘 국제 연애를 시작하세요.',
                heroSignup: '지금 무료 가입하기',
                heroBrowse: '프로필 둘러보기',
                badgeStrict: '까다로운 인증 = 100% 무료 혜택!',
                requirementsTitle: '프로필 승인 필수 조항',
                reqPhotosTitle: '필수 사진',
                reqFace: '얼굴 사진 3장 (정면, 선명하게)',
                reqFull: '전신 사진 3장',
                reqInfoTitle: '필수 정보',
                reqJob: '직업',
                reqEdu: '학력',
                reqHometown: '고향',
                reqSocialTitle: '소셜 미디어 3개 이상 인증 필수',
                reqSocialDesc: '페이스북, 인스타그램, 카카오톡, X (트위터), 네이버, 위챗',
                benefitsTitle: '승인 후 100% 무료 혜택!',
                benefit1: '무제한 메시징',
                benefit2: '자동 번역',
                benefit3: '화상 채팅',
                emphasisTitle: '가입 절차는 까다롭지만, 평생 100% 무료!',
                emphasisSubtitle: '양보다 질! 인증된 진지한 싱글만 만나세요.',
                featuresTitle: '왜 Global Love Bridge를 선택해야 할까요?',
                feature1Title: '인증된 회원만',
                feature1Desc: '안전과 신뢰를 위해 3개 이상의 소셜 미디어 계정으로 인증된 회원들',
                feature2Title: '실시간 번역',
                feature2Desc: '7개 언어로 자동 번역되어 모국어로 대화하세요. 언어 장벽 없이!',
                feature3Title: '화상 채팅',
                feature3Desc: 'HD 화상 채팅과 실시간 번역 자막으로 매치 상대를 직접 만나보세요.',
                feature4Title: 'AI 매칭',
                feature4Desc: 'AI 알고리즘이 관심사, 가치관, 선호도를 기반으로 완벽한 매치를 찾아줍니다.',
                feature5Title: '글로벌 커뮤니티',
                feature5Desc: '의미 있는 국제 관계를 찾는 100개 이상 국가의 회원들',
                feature6Title: '가상 선물 보내기',
                feature6Desc: '장미, 하트 등 가상 선물로 감정을 표현하세요!',
                navLogin: '로그인',
                howTitle: '어떻게 작동하나요?',
                step1Title: '가입하기',
                step1Desc: '3개 이상의 소셜 미디어 인증으로 계정 만들기',
                step2Title: '프로필 작성',
                step2Desc: '사진, 동영상을 추가하고 당신의 이야기를 들려주세요',
                step3Title: '매칭 받기',
                step3Desc: 'AI가 호환성을 기반으로 완벽한 매치를 찾아줍니다',
                step4Title: '데이팅 시작',
                step4Desc: '채팅, 화상 통화하며 관계를 발전시키세요',
                ctaTitle: '완벽한 매치를 찾을 준비가 되셨나요?',
                ctaSubtitle: '국경을 넘어 사랑을 찾는 수천 명의 싱글들과 함께하세요',
                ctaButton: '시작하기 - 무료입니다!'
            },
            en: {
                appTitle: 'Global Love Bridge',
                heroTitle: 'Find Love Across Borders',
                heroSubtitle: 'Connect with verified singles from around the world. Start your international love story today.',
                heroSignup: 'Sign Up Free Now',
                heroBrowse: 'Browse Profiles',
                badgeStrict: 'Strict Verification = 100% Free Benefits!',
                requirementsTitle: 'Profile Requirements for Approval',
                reqPhotosTitle: 'Required Photos',
                reqFace: '3 Face Photos (Clear, Front-facing)',
                reqFull: '3 Full-Body Photos',
                reqInfoTitle: 'Required Information',
                reqJob: 'Occupation / Job',
                reqEdu: 'Education Level',
                reqHometown: 'Hometown / Origin',
                reqSocialTitle: '3+ Social Media Accounts Required',
                reqSocialDesc: 'Facebook, Instagram, KakaoTalk, X (Twitter), Naver, WeChat',
                benefitsTitle: '100% FREE Benefits After Approval!',
                benefit1: 'Unlimited Messaging',
                benefit2: 'Auto Translation',
                benefit3: 'Video Chat',
                emphasisTitle: 'Strict Verification Process, but 100% Free Forever!',
                emphasisSubtitle: 'Quality over quantity. Meet verified, serious singles only.',
                featuresTitle: 'Why Choose Global Love Bridge?',
                feature1Title: 'Verified Members Only',
                feature1Desc: 'All members verified through 3+ social media accounts for your safety and trust.',
                feature2Title: 'Real-time Translation',
                feature2Desc: 'Chat in your language with automatic translation in 7 languages. No barriers!',
                feature3Title: 'Video Chat',
                feature3Desc: 'See your match face-to-face with HD video chat and real-time translation subtitles.',
                feature4Title: 'AI Matching',
                feature4Desc: 'Our AI algorithm finds your perfect match based on interests, values, and preferences.',
                feature5Title: 'Global Community',
                feature5Desc: 'Members from 100+ countries looking for meaningful international relationships.',
                feature6Title: 'Send Virtual Gifts',
                feature6Desc: 'Express your feelings with virtual gifts, roses, hearts, and more!',
                navLogin: 'Login',
                howTitle: 'How It Works',
                step1Title: 'Sign Up',
                step1Desc: 'Create account with 3+ social media verifications',
                step2Title: 'Create Profile',
                step2Desc: 'Add photos, videos, and tell your story',
                step3Title: 'Get Matched',
                step3Desc: 'AI finds your perfect match based on compatibility',
                step4Title: 'Start Dating',
                step4Desc: 'Chat, video call, and build your relationship',
                ctaTitle: 'Ready to Find Your Perfect Match?',
                ctaSubtitle: 'Join thousands of singles finding love across borders',
                ctaButton: "Get Started - It's Free!"
            },
            zh: {
                appTitle: 'Global Love Bridge',
                heroTitle: '跨越国界寻找真爱',
                heroSubtitle: '与来自世界各地经过验证的单身人士建立联系。今天开启您的国际爱情故事。',
                heroSignup: '立即免费注册',
                heroBrowse: '浏览个人资料',
                badgeStrict: '严格验证 = 100% 免费福利！',
                requirementsTitle: '个人资料审批必需项',
                reqPhotosTitle: '必需照片',
                reqFace: '3张面部照片（清晰正面）',
                reqFull: '3张全身照片',
                reqInfoTitle: '必需信息',
                reqJob: '职业',
                reqEdu: '学历',
                reqHometown: '家乡',
                reqSocialTitle: '必须验证3个以上社交媒体账号',
                reqSocialDesc: 'Facebook、Instagram、KakaoTalk、X (Twitter)、Naver、WeChat',
                benefitsTitle: '审批后100%免费福利！',
                benefit1: '无限消息',
                benefit2: '自动翻译',
                benefit3: '视频聊天',
                emphasisTitle: '注册流程严格，但永久100%免费！',
                emphasisSubtitle: '质量胜过数量。只见经过验证的认真单身人士。',
                featuresTitle: '为什么选择 Global Love Bridge？',
                feature1Title: '仅限认证会员',
                feature1Desc: '所有会员均通过3个以上社交媒体账号认证，保障您的安全和信任。',
                feature2Title: '实时翻译',
                feature2Desc: '用您的语言聊天，自动翻译成7种语言。无障碍沟通！',
                feature3Title: '视频聊天',
                feature3Desc: '通过高清视频聊天和实时翻译字幕面对面见您的匹配对象。',
                feature4Title: 'AI 配对',
                feature4Desc: '我们的AI算法根据兴趣、价值观和偏好为您找到完美匹配。',
                feature5Title: '全球社区',
                feature5Desc: '来自100多个国家的会员，寻找有意义的国际关系。',
                feature6Title: '发送虚拟礼物',
                feature6Desc: '用虚拟礼物、玫瑰、心形等表达您的情感！',
                navLogin: '登录',
                howTitle: '如何运作？',
                step1Title: '注册',
                step1Desc: '通过3个以上社交媒体认证创建账户',
                step2Title: '创建资料',
                step2Desc: '添加照片、视频，讲述您的故事',
                step3Title: '获得匹配',
                step3Desc: 'AI根据兼容性为您找到完美匹配',
                step4Title: '开始约会',
                step4Desc: '聊天、视频通话，建立您的关系',
                ctaTitle: '准备好找到您的完美匹配了吗？',
                ctaSubtitle: '加入数千名跨国寻找爱情的单身人士',
                ctaButton: '开始 - 完全免费！'
            },
            ja: {
                appTitle: 'Global Love Bridge',
                heroTitle: '国境を越えて愛を見つけよう',
                heroSubtitle: '世界中の認証済み独身者と繋がりましょう。今日から国際恋愛を始めましょう。',
                heroSignup: '今すぐ無料登録',
                heroBrowse: 'プロフィールを見る',
                badgeStrict: '厳格な認証 = 100% 無料特典！',
                requirementsTitle: 'プロフィール承認必須項目',
                reqPhotosTitle: '必須写真',
                reqFace: '顔写真3枚（正面、鮮明）',
                reqFull: '全身写真3枚',
                reqInfoTitle: '必須情報',
                reqJob: '職業',
                reqEdu: '学歴',
                reqHometown: '出身地',
                reqSocialTitle: 'ソーシャルメディア3つ以上の認証が必須',
                reqSocialDesc: 'Facebook、Instagram、KakaoTalk、X (Twitter)、Naver、WeChat',
                benefitsTitle: '承認後100%無料特典！',
                benefit1: '無制限メッセージ',
                benefit2: '自動翻訳',
                benefit3: 'ビデオチャット',
                emphasisTitle: '登録手続きは厳格ですが、永久100%無料！',
                emphasisSubtitle: '量より質！認証済みの真剣な独身者のみと出会えます。',
                featuresTitle: 'なぜ Global Love Bridge を選ぶのか？',
                feature1Title: '認証済み会員のみ',
                feature1Desc: '安全と信頼のため、3つ以上のソーシャルメディアアカウントで認証された会員のみ。',
                feature2Title: 'リアルタイム翻訳',
                feature2Desc: '7言語の自動翻訳で母国語でチャット。障壁はありません！',
                feature3Title: 'ビデオチャット',
                feature3Desc: 'HDビデオチャットとリアルタイム翻訳字幕でマッチと対面。',
                feature4Title: 'AIマッチング',
                feature4Desc: 'AIアルゴリズムが興味、価値観、好みに基づいて完璧なマッチを見つけます。',
                feature5Title: 'グローバルコミュニティ',
                feature5Desc: '意味のある国際関係を求める100カ国以上からの会員。',
                feature6Title: 'バーチャルギフトを送る',
                feature6Desc: 'バーチャルギフト、バラ、ハートなどで気持ちを表現しましょう！',
                navLogin: 'ログイン',
                howTitle: '使い方',
                step1Title: 'サインアップ',
                step1Desc: '3つ以上のソーシャルメディア認証でアカウント作成',
                step2Title: 'プロフィール作成',
                step2Desc: '写真、動画を追加し、あなたのストーリーを語ろう',
                step3Title: 'マッチング',
                step3Desc: 'AIが互換性に基づいて完璧なマッチを見つけます',
                step4Title: 'デート開始',
                step4Desc: 'チャット、ビデオ通話で関係を築きましょう',
                ctaTitle: '完璧なマッチを見つける準備はできましたか？',
                ctaSubtitle: '国境を越えて愛を見つける何千人もの独身者に参加しましょう',
                ctaButton: '始める - 無料です！'
            },
            vi: {
                appTitle: 'Global Love Bridge',
                heroTitle: 'Tìm Tình Yêu Xuyên Biên Giới',
                heroSubtitle: 'Kết nối với những người độc thân đã xác minh từ khắp nơi trên thế giới. Bắt đầu câu chuyện tình yêu quốc tế của bạn ngay hôm nay.',
                heroSignup: 'Đăng ký miễn phí ngay',
                heroBrowse: 'Xem hồ sơ',
                badgeStrict: 'Xác minh nghiêm ngặt = 100% Miễn phí!',
                requirementsTitle: 'Yêu cầu hồ sơ để được phê duyệt',
                reqPhotosTitle: 'Ảnh bắt buộc',
                reqFace: '3 ảnh khuôn mặt (Rõ ràng, chính diện)',
                reqFull: '3 ảnh toàn thân',
                reqInfoTitle: 'Thông tin bắt buộc',
                reqJob: 'Nghề nghiệp',
                reqEdu: 'Trình độ học vấn',
                reqHometown: 'Quê quán',
                reqSocialTitle: 'Yêu cầu xác minh 3+ tài khoản mạng xã hội',
                reqSocialDesc: 'Facebook, Instagram, KakaoTalk, X (Twitter), Naver, WeChat',
                benefitsTitle: 'Lợi ích 100% MIỄN PHÍ sau khi phê duyệt!',
                benefit1: 'Nhắn tin không giới hạn',
                benefit2: 'Tự động dịch',
                benefit3: 'Gọi video',
                emphasisTitle: 'Quy trình xác minh nghiêm ngặt, nhưng miễn phí 100% mãi mãi!',
                emphasisSubtitle: 'Chất lượng hơn số lượng. Chỉ gặp những người độc thân nghiêm túc đã xác minh.',
                featuresTitle: 'Tại Sao Chọn Global Love Bridge?',
                feature1Title: 'Chỉ Thành Viên Đã Xác Minh',
                feature1Desc: 'Tất cả thành viên được xác minh qua 3+ tài khoản mạng xã hội vì sự an toàn và tin cậy của bạn.',
                feature2Title: 'Dịch Thời Gian Thực',
                feature2Desc: 'Trò chuyện bằng ngôn ngữ của bạn với bản dịch tự động sang 7 ngôn ngữ. Không còn rào cản!',
                feature3Title: 'Gọi Video',
                feature3Desc: 'Gặp gỡ trực tiếp với đối tượng phù hợp qua gọi video HD và phụ đề dịch thời gian thực.',
                feature4Title: 'Ghép Cặp AI',
                feature4Desc: 'Thuật toán AI của chúng tôi tìm đối tượng hoàn hảo dựa trên sở thích, giá trị và ưu tiên.',
                feature5Title: 'Cộng Đồng Toàn Cầu',
                feature5Desc: 'Thành viên từ hơn 100 quốc gia đang tìm kiếm mối quan hệ quốc tế ý nghĩa.',
                feature6Title: 'Gửi Quà Ảo',
                feature6Desc: 'Thể hiện cảm xúc của bạn với quà ảo, hoa hồng, trái tim và nhiều hơn nữa!',
                navLogin: 'Đăng nhập',
                howTitle: 'Cách Hoạt Động',
                step1Title: 'Đăng Ký',
                step1Desc: 'Tạo tài khoản với 3+ xác minh mạng xã hội',
                step2Title: 'Tạo Hồ Sơ',
                step2Desc: 'Thêm ảnh, video và kể câu chuyện của bạn',
                step3Title: 'Được Ghép Cặp',
                step3Desc: 'AI tìm đối tượng hoàn hảo dựa trên sự tương thích',
                step4Title: 'Bắt Đầu Hẹn Hò',
                step4Desc: 'Trò chuyện, gọi video và xây dựng mối quan hệ',
                ctaTitle: 'Sẵn Sàng Tìm Đối Tượng Hoàn Hảo?',
                ctaSubtitle: 'Tham gia hàng ngàn người độc thân tìm tình yêu xuyên biên giới',
                ctaButton: 'Bắt Đầu - Hoàn Toàn Miễn Phí!'
            },
            es: {
                appTitle: 'Global Love Bridge',
                heroTitle: 'Encuentra el Amor Sin Fronteras',
                heroSubtitle: 'Conecta con solteros verificados de todo el mundo. Comienza tu historia de amor internacional hoy.',
                heroSignup: 'Regístrate gratis ahora',
                heroBrowse: 'Ver perfiles',
                badgeStrict: '¡Verificación estricta = 100% Gratis!',
                requirementsTitle: 'Requisitos del perfil para aprobación',
                reqPhotosTitle: 'Fotos requeridas',
                reqFace: '3 fotos de rostro (Claras, de frente)',
                reqFull: '3 fotos de cuerpo completo',
                reqInfoTitle: 'Información requerida',
                reqJob: 'Ocupación / Trabajo',
                reqEdu: 'Nivel educativo',
                reqHometown: 'Ciudad natal / Origen',
                reqSocialTitle: 'Se requieren 3+ cuentas de redes sociales',
                reqSocialDesc: 'Facebook, Instagram, KakaoTalk, X (Twitter), Naver, WeChat',
                benefitsTitle: '¡Beneficios 100% GRATIS después de la aprobación!',
                benefit1: 'Mensajes ilimitados',
                benefit2: 'Traducción automática',
                benefit3: 'Videollamada',
                emphasisTitle: '¡Proceso de verificación estricto, pero 100% gratis para siempre!',
                emphasisSubtitle: 'Calidad sobre cantidad. Conoce solo solteros verificados y serios.',
                featuresTitle: '¿Por Qué Elegir Global Love Bridge?',
                feature1Title: 'Solo Miembros Verificados',
                feature1Desc: 'Todos los miembros verificados a través de 3+ cuentas de redes sociales para tu seguridad y confianza.',
                feature2Title: 'Traducción en Tiempo Real',
                feature2Desc: 'Chatea en tu idioma con traducción automática a 7 idiomas. ¡Sin barreras!',
                feature3Title: 'Videollamada',
                feature3Desc: 'Conoce a tu pareja cara a cara con videollamada HD y subtítulos de traducción en tiempo real.',
                feature4Title: 'Emparejamiento con IA',
                feature4Desc: 'Nuestro algoritmo de IA encuentra tu pareja perfecta basándose en intereses, valores y preferencias.',
                feature5Title: 'Comunidad Global',
                feature5Desc: 'Miembros de más de 100 países buscando relaciones internacionales significativas.',
                feature6Title: 'Envía Regalos Virtuales',
                feature6Desc: '¡Expresa tus sentimientos con regalos virtuales, rosas, corazones y más!',
                navLogin: 'Iniciar sesión',
                howTitle: '¿Cómo Funciona?',
                step1Title: 'Regístrate',
                step1Desc: 'Crea una cuenta con 3+ verificaciones de redes sociales',
                step2Title: 'Crea tu Perfil',
                step2Desc: 'Añade fotos, videos y cuenta tu historia',
                step3Title: 'Encuentra Pareja',
                step3Desc: 'La IA encuentra tu pareja perfecta según compatibilidad',
                step4Title: 'Comienza a Salir',
                step4Desc: 'Chatea, haz videollamadas y construye tu relación',
                ctaTitle: '¿Listo para Encontrar tu Pareja Perfecta?',
                ctaSubtitle: 'Únete a miles de solteros que encuentran amor sin fronteras',
                ctaButton: '¡Comienza - Es Gratis!'
            },
            ar: {
                appTitle: 'Global Love Bridge',
                heroTitle: 'ابحث عن الحب عبر الحدود',
                heroSubtitle: 'تواصل مع العزاب المعتمدين من جميع أنحاء العالم. ابدأ قصة حبك الدولية اليوم.',
                heroSignup: 'سجل مجانا الآن',
                heroBrowse: 'تصفح الملفات الشخصية',
                badgeStrict: 'التحقق الصارم = 100٪ مجاني!',
                requirementsTitle: 'متطلبات الملف الشخصي للموافقة',
                reqPhotosTitle: 'الصور المطلوبة',
                reqFace: '3 صور للوجه (واضحة، أمامية)',
                reqFull: '3 صور للجسم بالكامل',
                reqInfoTitle: 'المعلومات المطلوبة',
                reqJob: 'المهنة / الوظيفة',
                reqEdu: 'المستوى التعليمي',
                reqHometown: 'مسقط الرأس / الأصل',
                reqSocialTitle: 'مطلوب 3+ حسابات وسائل التواصل الاجتماعي',
                reqSocialDesc: 'Facebook، Instagram، KakaoTalk، X (Twitter)، Naver، WeChat',
                benefitsTitle: 'فوائد 100٪ مجانية بعد الموافقة!',
                benefit1: 'رسائل غير محدودة',
                benefit2: 'ترجمة تلقائية',
                benefit3: 'مكالمة فيديو',
                emphasisTitle: 'عملية التحقق صارمة، لكنها مجانية 100٪ إلى الأبد!',
                emphasisSubtitle: 'الجودة أكثر من الكمية. قابل فقط العزاب الجادين والمعتمدين.',
                featuresTitle: 'لماذا تختار Global Love Bridge؟',
                feature1Title: 'أعضاء معتمدون فقط',
                feature1Desc: 'جميع الأعضاء معتمدون من خلال 3+ حسابات وسائل التواصل الاجتماعي لسلامتك وثقتك.',
                feature2Title: 'ترجمة فورية',
                feature2Desc: 'تحدث بلغتك مع ترجمة تلقائية إلى 7 لغات. لا حواجز!',
                feature3Title: 'مكالمة فيديو',
                feature3Desc: 'شاهد شريكك وجهاً لوجه مع مكالمة فيديو عالية الدقة وترجمات فورية.',
                feature4Title: 'مطابقة بالذكاء الاصطناعي',
                feature4Desc: 'خوارزمية الذكاء الاصطناعي لدينا تجد شريكك المثالي بناءً على الاهتمامات والقيم والتفضيلات.',
                feature5Title: 'مجتمع عالمي',
                feature5Desc: 'أعضاء من أكثر من 100 دولة يبحثون عن علاقات دولية ذات مغزى.',
                feature6Title: 'أرسل هدايا افتراضية',
                feature6Desc: 'عبر عن مشاعرك بهدايا افتراضية وورود وقلوب وأكثر!',
                navLogin: 'تسجيل الدخول',
                howTitle: 'كيف يعمل؟',
                step1Title: 'سجل',
                step1Desc: 'أنشئ حساباً مع 3+ تحققات من وسائل التواصل الاجتماعي',
                step2Title: 'أنشئ ملفك الشخصي',
                step2Desc: 'أضف صوراً ومقاطع فيديو واحكِ قصتك',
                step3Title: 'احصل على مطابقة',
                step3Desc: 'الذكاء الاصطناعي يجد شريكك المثالي بناءً على التوافق',
                step4Title: 'ابدأ المواعدة',
                step4Desc: 'تحدث، اتصل بالفيديو، وابنِ علاقتك',
                ctaTitle: 'هل أنت مستعد لإيجاد شريكك المثالي؟',
                ctaSubtitle: 'انضم إلى آلاف العزاب الذين يجدون الحب عبر الحدود',
                ctaButton: 'ابدأ - إنه مجاني!'
            }
        };

        // Language switcher
        document.getElementById('language-selector').addEventListener('change', function(e) {
            const lang = e.target.value;
            updateLanguage(lang);
            
            // Set HTML lang attribute for font switching
            document.documentElement.setAttribute('lang', lang);
            
            // Handle RTL for Arabic
            if (lang === 'ar') {
                document.documentElement.setAttribute('dir', 'rtl');
            } else {
                document.documentElement.setAttribute('dir', 'ltr');
            }
        });

        function updateLanguage(lang) {
            const t = translations[lang] || translations.en;
            
            // Update all translated elements
            Object.keys(t).forEach(key => {
                const element = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
                if (element) {
                    element.textContent = t[key];
                }
            });
        }

        // API Health Check
        axios.get('/api/health')
            .then(response => {
                console.log('API Status:', response.data);
            })
            .catch(error => {
                console.error('API Error:', error);
            });
    </script>
</body>
</html>
  `);
});

export default app;
