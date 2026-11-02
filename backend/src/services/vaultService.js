import prisma from '../lib/prisma.js';


/**
 * List all vault items for a user with assigned contacts
 */
export async function listVaultItems(userId) {
  const items = await prisma.vaultItem.findMany({
    where: { userId },
    include: {
      contactAssignments: {
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Map assignments to simple contacts array
  return items.map(item => ({
    ...item,
    contacts: item.contactAssignments.map(ca => ca.contact)
  }));
}

/**
 * Get a single vault item by ID
 */
export async function getVaultItem(userId, itemId) {
  const item = await prisma.vaultItem.findFirst({
    where: {
      id: itemId,
      userId
    },
    include: {
      contactAssignments: {
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  if (!item) return null;

  return {
    ...item,
    contacts: item.contactAssignments.map(ca => ca.contact)
  };
}

/**
 * Create a new encrypted vault item
 */
export async function createVaultItem(userId, { title, type, encryptedData, iv, releaseTier = 30, contactIds = [] }) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create the vault item
    const item = await tx.vaultItem.create({
      data: {
        userId,
        title,
        type,
        encryptedData,
        iv,
        releaseTier: parseInt(releaseTier, 10)
      }
    });

    // 2. Assign contacts if provided
    if (contactIds.length > 0) {
      // Verify contacts belong to this user
      const validContacts = await tx.trustedContact.findMany({
        where: {
          id: { in: contactIds },
          userId
        },
        select: { id: true }
      });

      if (validContacts.length > 0) {
        await tx.vaultItemContact.createMany({
          data: validContacts.map(c => ({
            vaultItemId: item.id,
            contactId: c.id
          }))
        });
      }
    }

    // Return with relations
    return await tx.vaultItem.findUnique({
      where: { id: item.id },
      include: {
        contactAssignments: {
          include: {
            contact: true
          }
        }
      }
    });
  });
}

/**
 * Update an existing vault item
 */
export async function updateVaultItem(userId, itemId, { title, type, encryptedData, iv, releaseTier, contactIds }) {
  return await prisma.$transaction(async (tx) => {
    // Check item exists and belongs to user
    const existing = await tx.vaultItem.findFirst({
      where: { id: itemId, userId }
    });

    if (!existing) {
      throw new Error('Vault item not found');
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (encryptedData !== undefined) updateData.encryptedData = encryptedData;
    if (iv !== undefined) updateData.iv = iv;
    if (releaseTier !== undefined) updateData.releaseTier = parseInt(releaseTier, 10);

    // Update item
    const updated = await tx.vaultItem.update({
      where: { id: itemId },
      data: updateData
    });

    // Update contact assignments if provided
    if (contactIds !== undefined) {
      // Delete old assignments
      await tx.vaultItemContact.deleteMany({
        where: { vaultItemId: itemId }
      });

      // Insert new assignments
      if (contactIds.length > 0) {
        const validContacts = await tx.trustedContact.findMany({
          where: {
            id: { in: contactIds },
            userId
          },
          select: { id: true }
        });

        if (validContacts.length > 0) {
          await tx.vaultItemContact.createMany({
            data: validContacts.map(c => ({
              vaultItemId: itemId,
              contactId: c.id
            }))
          });
        }
      }
    }

    return await tx.vaultItem.findUnique({
      where: { id: itemId },
      include: {
        contactAssignments: {
          include: {
            contact: true
          }
        }
      }
    });
  });
}

/**
 * Delete a vault item
 */
export async function deleteVaultItem(userId, itemId) {
  const existing = await prisma.vaultItem.findFirst({
    where: { id: itemId, userId }
  });

  if (!existing) {
    throw new Error('Vault item not found');
  }

  return await prisma.vaultItem.delete({
    where: { id: itemId }
  });
}
