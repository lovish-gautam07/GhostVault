import { describe, test, expect, beforeAll } from '@jest/globals';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../src/utils/auth.js';

describe('Authentication Utils', () => {
  describe('Password Hashing', () => {
    test('should hash a password', async () => {
      const password = 'mySecurePassword123';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(20);
    });

    test('should produce different hashes for same password', async () => {
      const password = 'samePassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    test('should verify correct password', async () => {
      const password = 'correctPassword';
      const hashed = await hashPassword(password);
      const isValid = await comparePassword(password, hashed);

      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'correctPassword';
      const hashed = await hashPassword(password);
      const isValid = await comparePassword('wrongPassword', hashed);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token', () => {
    test('should generate a valid token', () => {
      const userId = 'user-123';
      const token = generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should verify and decode a valid token', () => {
      const userId = 'user-456';
      const token = generateToken(userId);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(userId);
      expect(decoded.iat).toBeDefined(); // issued at
      expect(decoded.exp).toBeDefined(); // expiration
    });

    test('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    test('should return null for empty token', () => {
      const decoded = verifyToken('');

      expect(decoded).toBeNull();
    });
  });
});
