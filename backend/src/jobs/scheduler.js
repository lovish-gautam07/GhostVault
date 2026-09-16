import cron from 'node-cron';
import { triggerInactivityReleases, sendCheckInReminders } from '../services/checkinService.js';

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs() {
  console.log('⏰ Initializing cron jobs...');

  // Inactivity check job (default: daily at midnight)
  const inactivitySchedule = process.env.INACTIVITY_CRON_SCHEDULE || '0 0 * * *';
  cron.schedule(inactivitySchedule, async () => {
    console.log(`[${new Date().toISOString()}] Running inactivity check job...`);
    try {
      await triggerInactivityReleases();
    } catch (error) {
      console.error('Error in inactivity check job:', error);
    }
  });

  console.log(`✅ Inactivity check job scheduled: ${inactivitySchedule}`);

  // Check-in reminder job (default: daily at 9 AM)
  const checkinSchedule = process.env.CHECKIN_CRON_SCHEDULE || '0 9 * * *';
  cron.schedule(checkinSchedule, async () => {
    console.log(`[${new Date().toISOString()}] Running check-in reminder job...`);
    try {
      await sendCheckInReminders();
    } catch (error) {
      console.error('Error in check-in reminder job:', error);
    }
  });

  console.log(`✅ Check-in reminder job scheduled: ${checkinSchedule}`);

  console.log('✨ All cron jobs initialized successfully');
}
