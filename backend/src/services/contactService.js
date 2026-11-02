import prisma from '../lib/prisma.js';


/**
 * Get all trusted contacts for a user
 */
export async function listTrustedContacts(userId) {
  return await prisma.trustedContact.findMany({
    where: { userId },
    orderBy: { name: 'asc' }
  });
}

/**
 * Get a single trusted contact
 */
export async function getTrustedContact(userId, contactId) {
  return await prisma.trustedContact.findFirst({
    where: {
      id: contactId,
      userId
    }
  });
}

/**
 * Create a new trusted contact
 */
export async function createTrustedContact(userId, { name, email }) {
  return await prisma.trustedContact.create({
    data: {
      userId,
      name,
      email: email.toLowerCase()
    }
  });
}

/**
 * Update a trusted contact
 */
export async function updateTrustedContact(userId, contactId, { name, email }) {
  const existing = await prisma.trustedContact.findFirst({
    where: {
      id: contactId,
      userId
    }
  });

  if (!existing) {
    throw new Error('Contact not found');
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email.toLowerCase();

  return await prisma.trustedContact.update({
    where: { id: contactId },
    data: updateData
  });
}

/**
 * Delete a trusted contact
 */
export async function deleteTrustedContact(userId, contactId) {
  const existing = await prisma.trustedContact.findFirst({
    where: {
      id: contactId,
      userId
    }
  });

  if (!existing) {
    throw new Error('Contact not found');
  }

  // This will cascade delete assignments
  return await prisma.trustedContact.delete({
    where: { id: contactId }
  });
}
