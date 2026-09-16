import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { recordCheckIn, checkUserActivity, getCheckInStatus } from '../src/services/checkinService.js';

const prisma = new PrismaClient();

describe('Check-In Service', () => {
  let testUser;

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        email: 'checkin-test@example.com',
        password: 'hashedpassword',
        name: 'Check-in Test User',
        lastCheckinAt: new Date()
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.checkIn.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  test('should record a manual check-in', async () => {
    const checkin = await recordCheckIn(testUser.id, 'manual');

    expect(checkin).toBeDefined();
    expect(checkin.userId).toBe(testUser.id);
    expect(checkin.method).toBe('manual');
    expect(checkin.timestamp).toBeInstanceOf(Date);

    // Verify user's lastCheckinAt was updated
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id }
    });
    expect(updatedUser.lastCheckinAt).toBeInstanceOf(Date);
  });

  test('should check user activity status', async () => {
    const activity = await checkUserActivity(testUser.id);

    expect(activity).toBeDefined();
    expect(activity.inactive).toBeDefined();
    expect(activity.daysSinceLastCheckin).toBeDefined();
    expect(Array.isArray(activity.releaseTiers)).toBe(true);
  });

  test('should get check-in status for user', async () => {
    const status = await getCheckInStatus(testUser.id);

    expect(status).toBeDefined();
    expect(status.lastCheckinAt).toBeDefined();
    expect(typeof status.daysSinceLastCheckin).toBe('number');
    expect(status.isAtRisk).toBeDefined();
  });

  test('should show user is not at risk immediately after check-in', async () => {
    await recordCheckIn(testUser.id, 'manual');

    const status = await getCheckInStatus(testUser.id);
    expect(status.daysSinceLastCheckin).toBe(0);
    expect(status.isAtRisk).toBe(false);
  });
});
