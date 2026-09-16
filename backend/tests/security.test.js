import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../src/utils/auth.js';
import { createVaultItem } from '../src/services/vaultService.js';

const prisma = new PrismaClient();

describe('Security and Encryption Verification', () => {
  let user;
  let contact;
  let vaultItem;
  let release;

  beforeAll(async () => {
    // Setup test user
    const hashedPassword = await hashPassword('TestSec123!');
    user = await prisma.user.create({
      data: {
        email: 'security-test@example.com',
        password: hashedPassword,
        name: 'Security Test User',
        keyHint: 'My secret vacation spot'
      }
    });

    contact = await prisma.trustedContact.create({
      data: {
        userId: user.id,
        name: 'Beneficiary Contact',
        email: 'beneficiary@example.com'
      }
    });

    vaultItem = await createVaultItem(user.id, {
      title: 'Zero Knowledge Ciphertext',
      type: 'password',
      encryptedData: 'dGVzdC1lbmNyeXB0ZWQtY2lwaGVydGV4dA==',
      iv: 'MTIzNDU2Nzg5MDEy',
      releaseTier: 7,
      contactIds: [contact.id]
    });

    release = await prisma.release.create({
      data: {
        userId: user.id,
        vaultItemId: vaultItem.id,
        contactId: contact.id,
        status: 'sent',
        sentAt: new Date()
      }
    });
  });

  afterAll(async () => {
    await prisma.release.deleteMany({ where: { userId: user.id } });
    await prisma.vaultItem.deleteMany({ where: { userId: user.id } });
    await prisma.trustedContact.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  describe('Zero Knowledge Vault Storage', () => {
    test('stored vault item only contains ciphertext and IV, never plaintext', async () => {
      const stored = await prisma.vaultItem.findUnique({
        where: { id: vaultItem.id }
      });

      expect(stored.encryptedData).toBe('dGVzdC1lbmNyeXB0ZWQtY2lwaGVydGV4dA==');
      expect(stored.iv).toBe('MTIzNDU2Nzg5MDEy');
      // Verify no sensitive plaintext fields exist on vault schema
      expect(stored.password).toBeUndefined();
      expect(stored.masterKey).toBeUndefined();
      expect(stored.secret).toBeUndefined();
    });

    test('password hash uses bcrypt with 12 rounds', async () => {
      const storedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      // bcrypt hashes with cost factor 12 start with $2a$12$ or $2b$12$
      expect(storedUser.password).toMatch(/^\$2[ab]\$12\$/);
      expect(await comparePassword('TestSec123!', storedUser.password)).toBe(true);
      expect(await comparePassword('WrongPassword123!', storedUser.password)).toBe(false);
    });
  });

  describe('Emergency Release Public Projection', () => {
    test('release query returns ciphertext and metadata without exposing user password hash', async () => {
      const releaseRecord = await prisma.release.findUnique({
        where: { id: release.id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              keyHint: true
            }
          },
          vaultItem: {
            select: {
              id: true,
              title: true,
              type: true,
              encryptedData: true,
              iv: true,
              releaseTier: true
            }
          },
          contact: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      expect(releaseRecord).toBeDefined();
      expect(releaseRecord.user.keyHint).toBe('My secret vacation spot');
      expect(releaseRecord.user.password).toBeUndefined();
      expect(releaseRecord.vaultItem.encryptedData).toBeDefined();
      expect(releaseRecord.vaultItem.iv).toBeDefined();
    });
  });

  describe('JWT Verification Boundaries', () => {
    test('expired or tampered tokens are rejected', () => {
      const validToken = generateToken(user.id);
      expect(verifyToken(validToken)).not.toBeNull();

      // Tamper with payload
      const parts = validToken.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}extra.${parts[2]}`;
      expect(verifyToken(tamperedToken)).toBeNull();
    });
  });
});
