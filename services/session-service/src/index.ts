import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { Pool } from 'pg';
import { SessionRepository } from './repositories/SessionRepository';
import { GroupRepository } from './repositories/GroupRepository';
import { AuthorRepository } from './repositories/AuthorRepository';
import { SessionService } from './services/SessionService';
import { SessionController } from './controllers/SessionController';
import { createSessionRouter } from './routes/session.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'session-service' });
});

// Initialize database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'etherpad',
  password: process.env.DB_PASSWORD || 'etherpad',
  database: process.env.DB_NAME || 'etherpad',
});

// Initialize repositories, services, and controllers
const sessionRepository = new SessionRepository(pool);
const groupRepository = new GroupRepository(pool);
const authorRepository = new AuthorRepository(pool);
const sessionService = new SessionService(sessionRepository, groupRepository, authorRepository);
const sessionController = new SessionController(sessionService);

// Register routes
const sessionRouter = createSessionRouter(sessionController);
app.use('/api/sessions', sessionRouter);

// Error handler (basic version, will be enhanced in later steps)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Session service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});
