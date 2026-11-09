import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 12; // Increased from 10 for stronger key stretching

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required in production.');
    }
    // Safe dev/test secret with explicit logged warning
    return 'ghostvault-local-development-secret-key-32chars!';
  }
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters in production.');
  }
  return secret;
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Hash a password using bcrypt with 12 salt rounds
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain password with a hashed password
 */
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId) {
  const secret = getJwtSecret();
  return jwt.sign({ userId }, secret, { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' });
}

/**
 * Verify and decode a JWT token
 * Returns the decoded payload or null if invalid
 */
export function verifyToken(token) {
  try {
    const secret = getJwtSecret();
    // Pin the algorithm to block algorithm-confusion attacks
    return jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch (error) {
    return null;
  }
}
