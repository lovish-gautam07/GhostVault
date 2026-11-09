import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.js';
import * as contactService from '../services/contactService.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address')
});

const updateContactSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional()
});

/**
 * GET /api/contacts
 * List all trusted contacts
 */
router.get('/', async (req, res, next) => {
  try {
    const contacts = await contactService.listTrustedContacts(req.user.id);
    res.json({ contacts });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/contacts/:id
 * Get a specific contact
 */
router.get('/:id', async (req, res, next) => {
  try {
    const contact = await contactService.getTrustedContact(req.user.id, req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/contacts
 * Create a new trusted contact
 */
router.post('/', async (req, res, next) => {
  try {
    const data = createContactSchema.parse(req.body);
    const contact = await contactService.createTrustedContact(req.user.id, data);
    res.status(201).json(contact);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues
      });
    }
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'A contact with this email already exists'
      });
    }
    next(error);
  }
});

/**
 * PATCH /api/contacts/:id
 * Update a trusted contact
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const data = updateContactSchema.parse(req.body);
    const contact = await contactService.updateTrustedContact(req.user.id, req.params.id, data);
    res.json(contact);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues
      });
    }
    if (error.message === 'Contact not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * DELETE /api/contacts/:id
 * Delete a trusted contact
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await contactService.deleteTrustedContact(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error.message === 'Contact not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

export default router;
