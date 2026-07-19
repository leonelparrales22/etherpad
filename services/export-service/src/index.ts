import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { Pool } from 'pg';
import { PadRepository } from './repositories/PadRepository';
import { ExportService } from './services/ExportService';
import { ExportController } from './controllers/ExportController';
import { createExportRouter } from './routes/export.routes';
import { NotFoundError, ValidationError, DatabaseError } from './errors';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'export-service' });
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
const padRepository = new PadRepository(pool);
const exportService = new ExportService(padRepository);
const exportController = new ExportController(exportService);

// Register routes
const exportRouter = createExportRouter(exportController);
app.use('/api/export', exportRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof DatabaseError) {
    return res.status(500).json({ error: 'Database error' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Export service running on port ${PORT}`);
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
