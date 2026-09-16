import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend .env file explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Ensure critical test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ghostvault-test-secret-key-32chars-min!';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
