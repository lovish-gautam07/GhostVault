import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { triggerInactivityReleases } from '../src/services/checkinService.js';
import { createVaultItem } from '../src/services/vaultService.js';

const prisma = new PrismaClient();

/**
 * Integration test: Full flow from user creation to release trigger
 * This tests the core "dead man's switch" functionality
 */
describe('Release Logic Integration Test', () => {
  let inactiveUser;
  let activeUser;
  let emergencyContact;
  let vaultItem;

  beforeAll(async () => {
    // Create an inactive user (last checked in 8 days ago)
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    inactiveUser = await prisma.user.create({
      data: {
        email: 'inactive@example.com',
        password: 'hashedpassword',
        name: 'Inactive User',
        lastCheckinAt: eightDaysAgo
      }
    });

    // Create an active user
    activeUser = await prisma.user.create({
      data: {
        email: 'active@example.com',
        password: 'hashedpassword',
        name: 'Active User',
        lastCheckinAt: new Date()
      }
    });

    // Create emergency contact for inactive user
    emergencyContact = await prisma.trustedContact.create({
      data: {
        userId: inactiveUser.id,
        name: 'Emergency Contact',
        email: 'emergency@example.com'
      }
    });

    // Create a vault item with 7-day release tier
    vaultItem = await createVaultItem(inactiveUser.id, {
      title: 'Important Password',
      type: 'password',
      encryptedData: 'encrypted-sensitive-data',
      iv: 'initialization-vector',
      releaseTier: 7,
      contactIds: [emergencyContact.id]
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.release.deleteMany({ where: { userId: inactiveUser.id } });
    await prisma.vaultItem.deleteMany({ where: { userId: inactiveUser.id } });
    await prisma.trustedContact.deleteMany({ where: { userId: inactiveUser.id } });
    await prisma.user.delete({ where: { id: inactiveUser.id } });
    await prisma.user.delete({ where: { id: activeUser.id } });
    await prisma.$disconnect();
  });

  test('should trigger release for inactive user past release tier', async () => {
    // Run the inactivity check
    const result = await triggerInactivityReleases();

    expect(result).toBeDefined();
    expect(result.totalReleases).toBeGreaterThanOrEqual(1);

    // Verify release record was created
    const releases = await prisma.release.findMany({
      where: {
        userId: inactiveUser.id,
        vaultItemId: vaultItem.id,
        contactId: emergencyContact.id
      }
    });

    expect(releases.length).toBeGreaterThanOrEqual(1);
    const release = releases[0];
    expect(release.status).toBe('sent');
    expect(release.sentAt).toBeInstanceOf(Date);
  });

  test('should not create duplicate releases', async () => {
    // Run the inactivity check again
    await triggerInactivityReleases();

    // Should still only have one release
    const releases = await prisma.release.findMany({
      where: {
        userId: inactiveUser.id,
        vaultItemId: vaultItem.id,
        contactId: emergencyContact.id
      }
    });

    expect(releases.length).toBe(1);
  });

  test('should not trigger release for active user', async () => {
    // Create vault item for active user
    const activeContact = await prisma.trustedContact.create({
      data: {
        userId: activeUser.id,
        name: 'Active Contact',
        email: 'active-contact@example.com'
      }
    });

    const activeVaultItem = await createVaultItem(activeUser.id, {
      title: 'Active User Data',
      type: 'note',
      encryptedData: 'active-user-data',
      iv: 'active-iv',
      releaseTier: 7,
      contactIds: [activeContact.id]
    });

    // Run inactivity check
    await triggerInactivityReleases();

    // Should have no releases for active user
    const releases = await prisma.release.findMany({
      where: {
        userId: activeUser.id,
        vaultItemId: activeVaultItem.id
      }
    });

    expect(releases.length).toBe(0);

    // Cleanup
    await prisma.vaultItem.delete({ where: { id: activeVaultItem.id } });
    await prisma.trustedContact.delete({ where: { id: activeContact.id } });
  });
});
