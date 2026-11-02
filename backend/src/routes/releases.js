import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

/**
 * GET /api/releases/:id
 * Retrieve emergency release details for a trusted contact
 * Public endpoint protected by UUID release ID (bearer token model for email links)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const release = await prisma.release.findUnique({
      where: { id },
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

    if (!release) {
      return res.status(404).json({ error: 'Emergency release record not found or expired.' });
    }

    res.json({
      releaseId: release.id,
      status: release.status,
      triggeredAt: release.triggeredAt,
      owner: {
        name: release.user.name,
        keyHint: release.user.keyHint
      },
      contact: {
        name: release.contact.name,
        email: release.contact.email
      },
      vaultItem: {
        id: release.vaultItem.id,
        title: release.vaultItem.title,
        type: release.vaultItem.type,
        encryptedData: release.vaultItem.encryptedData,
        iv: release.vaultItem.iv
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
