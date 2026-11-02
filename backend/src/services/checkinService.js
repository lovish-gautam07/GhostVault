import prisma from '../lib/prisma.js';
import { sendCheckinReminder, sendEmergencyReleaseEmail } from './emailService.js';


/**
 * Record a manual check-in by the user
 */
export async function recordCheckIn(userId, method = 'manual') {
  const now = new Date();

  // Update user's lastCheckinAt
  await prisma.user.update({
    where: { id: userId },
    data: { lastCheckinAt: now }
  });

  // Record check-in event
  const checkin = await prisma.checkIn.create({
    data: {
      userId,
      method,
      timestamp: now
    }
  });

  return checkin;
}

/**
 * Check if a user is inactive based on their last check-in
 * Returns { inactive: boolean, daysSinceLastCheckin: number, releaseTiers: number[] }
 */
export async function checkUserActivity(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastCheckinAt: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  const lastCheckin = new Date(user.lastCheckinAt);
  const daysSinceLastCheckin = Math.floor((now - lastCheckin) / (1000 * 60 * 60 * 24));

  // Get all unique release tiers for this user's vault items
  const vaultItems = await prisma.vaultItem.findMany({
    where: { userId },
    select: { releaseTier: true }
  });

  const releaseTiers = [...new Set(vaultItems.map(item => item.releaseTier))].sort((a, b) => a - b);

  return {
    inactive: daysSinceLastCheckin > 0,
    daysSinceLastCheckin,
    releaseTiers
  };
}

/**
 * Get check-in status for a user (for dashboard)
 */
export async function getCheckInStatus(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastCheckinAt: true,
      vaultItems: {
        select: { releaseTier: true }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  const lastCheckin = new Date(user.lastCheckinAt);
  const daysSinceLastCheckin = Math.floor((now - lastCheckin) / (1000 * 60 * 60 * 24));

  // Find the shortest release tier (most urgent)
  const minReleaseTier = user.vaultItems.length > 0
    ? Math.min(...user.vaultItems.map(item => item.releaseTier))
    : null;

  return {
    lastCheckinAt: user.lastCheckinAt,
    daysSinceLastCheckin,
    nextReleaseTier: minReleaseTier,
    daysUntilRelease: minReleaseTier !== null ? Math.max(0, minReleaseTier - daysSinceLastCheckin) : null,
    isAtRisk: Boolean(minReleaseTier !== null && daysSinceLastCheckin >= minReleaseTier)
  };
}

/**
 * Trigger emergency releases for inactive users
 * This is called by the cron job
 */
export async function triggerInactivityReleases() {
  console.log('🔍 Checking for inactive users and pending releases...');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      lastCheckinAt: true
    }
  });

  let totalReleases = 0;

  for (const user of users) {
    const now = new Date();
    const lastCheckin = new Date(user.lastCheckinAt);
    const daysSinceLastCheckin = Math.floor((now - lastCheckin) / (1000 * 60 * 60 * 24));

    if (daysSinceLastCheckin === 0) continue; // User is active

    // Find vault items that should be released
    const itemsToRelease = await prisma.vaultItem.findMany({
      where: {
        userId: user.id,
        releaseTier: { lte: daysSinceLastCheckin }
      },
      include: {
        contactAssignments: {
          include: {
            contact: true
          }
        }
      }
    });

    for (const item of itemsToRelease) {
      for (const assignment of item.contactAssignments) {
        const contact = assignment.contact;

        // Check if already released
        const existingRelease = await prisma.release.findFirst({
          where: {
            userId: user.id,
            vaultItemId: item.id,
            contactId: contact.id,
            status: { in: ['sent', 'pending'] }
          }
        });

        if (existingRelease) {
          continue; // Already released
        }

        // Create release record
        const release = await prisma.release.create({
          data: {
            userId: user.id,
            vaultItemId: item.id,
            contactId: contact.id,
            status: 'pending'
          }
        });

        // Send email
        try {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const accessUrl = `${frontendUrl}/emergency-access/${release.id}`;

          await sendEmergencyReleaseEmail({
            to: contact.email,
            contactName: contact.name,
            ownerName: user.name,
            vaultItemTitle: item.title,
            vaultItemType: item.type,
            accessUrl,
            encryptedPayload: item.encryptedData,
            iv: item.iv
          });

          // Mark as sent
          await prisma.release.update({
            where: { id: release.id },
            data: {
              status: 'sent',
              sentAt: new Date()
            }
          });

          console.log(`✅ Released "${item.title}" to ${contact.email}`);
          totalReleases++;
        } catch (error) {
          console.error(`❌ Failed to send release email to ${contact.email}:`, error.message);
          await prisma.release.update({
            where: { id: release.id },
            data: { status: 'failed' }
          });
        }
      }
    }
  }

  console.log(`✨ Inactivity check complete. ${totalReleases} releases triggered.`);
  return { totalReleases };
}

/**
 * Send check-in reminders to users approaching their release tiers
 */
export async function sendCheckInReminders() {
  console.log('📧 Sending check-in reminders...');

  const users = await prisma.user.findMany({
    include: {
      vaultItems: {
        select: { releaseTier: true }
      }
    }
  });

  let remindersSent = 0;

  for (const user of users) {
    if (user.vaultItems.length === 0) continue;

    const now = new Date();
    const lastCheckin = new Date(user.lastCheckinAt);
    const daysSinceLastCheckin = Math.floor((now - lastCheckin) / (1000 * 60 * 60 * 24));

    // Find shortest release tier
    const minTier = Math.min(...user.vaultItems.map(item => item.releaseTier));
    const daysUntilRelease = minTier - daysSinceLastCheckin;

    // Send reminder if within 3 days of release
    if (daysUntilRelease > 0 && daysUntilRelease <= 3) {
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const checkinUrl = `${frontendUrl}/dashboard?checkin=true`;
        const deadlineDate = new Date(lastCheckin);
        deadlineDate.setDate(deadlineDate.getDate() + minTier);

        await sendCheckinReminder({
          to: user.email,
          name: user.name,
          checkinUrl,
          deadlineDate
        });

        console.log(`✅ Sent reminder to ${user.email}`);
        remindersSent++;
      } catch (error) {
        console.error(`❌ Failed to send reminder to ${user.email}:`, error.message);
      }
    }
  }

  console.log(`📬 Sent ${remindersSent} check-in reminders.`);
  return { remindersSent };
}
