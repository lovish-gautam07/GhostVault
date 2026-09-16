import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import {
  createVaultItem,
  listVaultItems,
  getVaultItem,
  updateVaultItem,
  deleteVaultItem
} from '../src/services/vaultService.js';

const prisma = new PrismaClient();

describe('Vault Service', () => {
  let testUser;
  let testContact;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'vault-test@example.com',
        password: 'hashedpassword',
        name: 'Vault Test User'
      }
    });

    // Create test contact
    testContact = await prisma.trustedContact.create({
      data: {
        userId: testUser.id,
        name: 'Test Contact',
        email: 'contact@example.com'
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.vaultItem.deleteMany({ where: { userId: testUser.id } });
    await prisma.trustedContact.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  test('should create a vault item with encryption', async () => {
    const itemData = {
      title: 'Test Password',
      type: 'password',
      encryptedData: 'base64-encrypted-data-here',
      iv: 'base64-iv-here',
      releaseTier: 30,
      contactIds: [testContact.id]
    };

    const item = await createVaultItem(testUser.id, itemData);

    expect(item).toBeDefined();
    expect(item.title).toBe(itemData.title);
    expect(item.type).toBe(itemData.type);
    expect(item.encryptedData).toBe(itemData.encryptedData);
    expect(item.iv).toBe(itemData.iv);
    expect(item.releaseTier).toBe(30);
    expect(item.userId).toBe(testUser.id);
  });

  test('should list all vault items for user', async () => {
    // Create a second item
    await createVaultItem(testUser.id, {
      title: 'Test Note',
      type: 'note',
      encryptedData: 'encrypted-note-data',
      iv: 'note-iv',
      releaseTier: 7
    });

    const items = await listVaultItems(testUser.id);

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].userId).toBe(testUser.id);
  });

  test('should get a specific vault item', async () => {
    const allItems = await listVaultItems(testUser.id);
    const firstItem = allItems[0];

    const item = await getVaultItem(testUser.id, firstItem.id);

    expect(item).toBeDefined();
    expect(item.id).toBe(firstItem.id);
    expect(item.userId).toBe(testUser.id);
  });

  test('should return null for non-existent vault item', async () => {
    const item = await getVaultItem(testUser.id, 'non-existent-id');
    expect(item).toBeNull();
  });

  test('should update a vault item', async () => {
    const items = await listVaultItems(testUser.id);
    const itemToUpdate = items[0];

    const updated = await updateVaultItem(testUser.id, itemToUpdate.id, {
      title: 'Updated Title',
      releaseTier: 60
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.releaseTier).toBe(60);
  });

  test('should delete a vault item', async () => {
    // Create a temporary item to delete
    const tempItem = await createVaultItem(testUser.id, {
      title: 'Temp Item',
      type: 'note',
      encryptedData: 'temp-data',
      iv: 'temp-iv',
      releaseTier: 30
    });

    await deleteVaultItem(testUser.id, tempItem.id);

    // Verify deletion
    const item = await getVaultItem(testUser.id, tempItem.id);
    expect(item).toBeNull();
  });

  test('should not allow deleting another user\'s vault item', async () => {
    const items = await listVaultItems(testUser.id);
    const itemId = items[0].id;

    await expect(
      deleteVaultItem('different-user-id', itemId)
    ).rejects.toThrow('Vault item not found');
  });
});
