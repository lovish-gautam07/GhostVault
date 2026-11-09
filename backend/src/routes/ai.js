import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import * as ai from '../services/aiService.js';

const router = express.Router();

// AI calls cost money/quota: keep a tight per-IP limit (in addition to the global one)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Please try again in a few minutes.' }
});
router.use(aiLimiter);

function handleZod(error, res, next) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: error.issues });
  }
  return next(error);
}

/**
 * GET /api/ai/status
 * Tells the UI whether live AI is enabled. Never exposes the key.
 */
router.get('/status', (_req, res) => {
  res.json({ enabled: ai.isAiConfigured(), provider: 'gemini' });
});

/**
 * POST /api/ai/chat
 * Public (works on landing page too). Stateless: client sends the recent history.
 */
const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(1000)
      })
    )
    .min(1)
    .max(12)
});

router.post('/chat', async (req, res, next) => {
  try {
    const { messages } = chatSchema.parse(req.body);
    if (messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'Last message must be from the user' });
    }
    const result = await ai.chat(messages);
    res.json(result);
  } catch (error) {
    handleZod(error, res, next);
  }
});

/**
 * POST /api/ai/letter  (auth)
 * The user explicitly opts in to sending this draft text to the AI provider.
 */
const letterSchema = z.object({
  draft: z.string().trim().min(10, 'Write a few words first (at least 10 characters)').max(4000),
  recipientName: z.string().trim().max(100).optional().default(''),
  relationship: z.string().trim().max(100).optional().default(''),
  tone: z.enum(['heartfelt', 'practical', 'uplifting', 'formal']).default('heartfelt')
});

router.post('/letter', authenticateToken, async (req, res, next) => {
  try {
    const input = letterSchema.parse(req.body);
    const result = await ai.writeLetter(input);
    res.json(result);
  } catch (error) {
    handleZod(error, res, next);
  }
});

/**
 * GET /api/ai/advisor  (auth)
 * Builds anonymous metadata server-side (counts only: no titles, emails or ciphertext).
 */
router.get('/advisor', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [items, contacts] = await Promise.all([
      prisma.vaultItem.findMany({
        where: { userId },
        select: { type: true, releaseTier: true, _count: { select: { contactAssignments: true } } }
      }),
      prisma.trustedContact.findMany({
        where: { userId },
        select: { _count: { select: { vaultItems: true } } }
      })
    ]);

    const typeCounts = items.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {});

    const metadata = {
      itemCount: items.length,
      contactCount: contacts.length,
      itemsWithoutContacts: items.filter((i) => i._count.contactAssignments === 0).length,
      contactsWithoutItems: contacts.filter((c) => c._count.vaultItems === 0).length,
      releaseTiers: [...new Set(items.map((i) => i.releaseTier))].sort((a, b) => a - b),
      daysSinceCheckin: Math.floor((Date.now() - new Date(req.user.lastCheckinAt).getTime()) / 86400000),
      typeCounts
    };

    const result = await ai.adviseOnVault(metadata);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/password-tips
 * Receives ONLY derived features. The schema is strict so a raw password can't be smuggled in.
 */
const passwordFeaturesSchema = z
  .object({
    length: z.number().int().min(0).max(1024),
    hasLower: z.boolean(),
    hasUpper: z.boolean(),
    hasDigit: z.boolean(),
    hasSymbol: z.boolean(),
    isCommon: z.boolean(),
    hasSequence: z.boolean(),
    hasRepeat: z.boolean(),
    hasYear: z.boolean(),
    looksLikeWord: z.boolean(),
    entropyBits: z.number().min(0).max(10000),
    score: z.number().int().min(0).max(4)
  })
  .strict();

router.post('/password-tips', async (req, res, next) => {
  try {
    const features = passwordFeaturesSchema.parse(req.body);
    const result = await ai.passwordTips(features);
    res.json(result);
  } catch (error) {
    handleZod(error, res, next);
  }
});

export default router;
