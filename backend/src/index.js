import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import vaultRoutes from './routes/vault.js';
import contactRoutes from './routes/contacts.js';
import checkinRoutes from './routes/checkin.js';
import releaseRoutes from './routes/releases.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { initializeCronJobs } from './jobs/scheduler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000']
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// 2. Strict CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3000'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 3. Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));

// 4. Rate Limiting
const isTestEnv = process.env.NODE_ENV === 'test';

// General API rate limiter (300 requests per 15 minutes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Strict rate limiter for Authentication routes (30 requests per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 10000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// 5. Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'GhostVault API',
    timestamp: new Date().toISOString()
  });
});

// 6. Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/releases', releaseRoutes);

// 7. Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// 8. Start server (only if not running under test)
let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🔒 GhostVault Secure API running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // Initialize dead man's switch cron jobs
    initializeCronJobs();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    if (server) {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    }
  });
}

export default app;
