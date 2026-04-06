import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.js';
import repoRoutes from './routes/repos.js';
import jobRoutes from './routes/jobs.js';
import analyzeRoutes from './routes/analyze.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (!req.path.startsWith('/health')) {
      console.log(`  ${req.method} ${req.path} → ${res.statusCode} (${ms}ms)`);
    }
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'thinksync-api',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/analyze', analyzeRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n  ┌─────────────────────────────────────────┐`);
  console.log(`  │  ThinkSync API running on port ${PORT}     │`);
  console.log(`  │  Health: http://localhost:${PORT}/health    │`);
  console.log(`  └─────────────────────────────────────────┘\n`);
});
