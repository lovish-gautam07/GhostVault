import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.js';
import * as vaultService from '../services/vaultService.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createVaultItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  type: z.enum(['note', 'password', 'document']),
  encryptedData: z.string().min(1, 'Encrypted data is required'),
  iv: z.string().min(1, 'IV is required'),
  releaseTier: z.number().int().min(1).max(365).default(30),
  contactIds: z.array(z.string().uuid()).optional().default([])
});

const updateVaultItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(['note', 'password', 'document']).optional(),
  encryptedData: z.string().min(1).optional(),
  iv: z.string().min(1).optional(),
  releaseTier: z.number().int().min(1).max(365).optional(),
  contactIds: z.array(z.string().uuid()).optional()
});

/**
 * GET /api/vault
 * List all vault items for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const items = await vaultService.listVaultItems(req.user.id);
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/vault/:id
 * Get a specific vault item
 */
router.get('/:id', async (req, res, next) => {
  try {
    const item = await vaultService.getVaultItem(req.user.id, req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Vault item not found' });
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/vault
 * Create a new vault item
 */
router.post('/', async (req, res, next) => {
  try {
    const data = createVaultItemSchema.parse(req.body);
    const item = await vaultService.createVaultItem(req.user.id, data);
    res.status(201).json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues
      });
    }
    next(error);
  }
});

/**
 * PATCH /api/vault/:id
 * Update a vault item
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const data = updateVaultItemSchema.parse(req.body);
    const item = await vaultService.updateVaultItem(req.user.id, req.params.id, data);
    res.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues
      });
    }
    if (error.message === 'Vault item not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * DELETE /api/vault/:id
 * Delete a vault item
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await vaultService.deleteVaultItem(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error.message === 'Vault item not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

export default router;
