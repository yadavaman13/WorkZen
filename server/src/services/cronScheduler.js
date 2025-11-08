/**
 * Cron Job Scheduler
 * Runs daily attendance detection and other scheduled tasks
 */

const cron = require('node-cron');
const mergeQueueController = require('../controllers/mergQueueController');

class CronScheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * Start all cron jobs
   */
  start() {
    console.log('🕐 Starting cron scheduler...');

    // Run missing attendance detection daily at 1:00 AM
    const attendanceJob = cron.schedule('0 1 * * *', async () => {
      console.log('\n🔄 Running daily attendance detection cron job...');
      try {
        await mergeQueueController.detectMissingAttendance();
        console.log('✅ Attendance detection completed\n');
      } catch (error) {
        console.error('❌ Attendance detection failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.jobs.push({ name: 'attendance-detection', job: attendanceJob });

    // Optional: Run immediately on startup for testing
    if (process.env.RUN_CRON_ON_STARTUP === 'true') {
      console.log('🚀 Running attendance detection immediately (startup)...');
      mergeQueueController.detectMissingAttendance()
        .then(() => console.log('✅ Startup attendance detection completed'))
        .catch(err => console.error('❌ Startup attendance detection failed:', err));
    }

    console.log(`✅ Scheduled ${this.jobs.length} cron job(s)`);
    this.jobs.forEach(j => console.log(`   - ${j.name}`));
  }

  /**
   * Stop all cron jobs
   */
  stop() {
    console.log('🛑 Stopping cron scheduler...');
    this.jobs.forEach(j => {
      j.job.stop();
      console.log(`   - Stopped ${j.name}`);
    });
    console.log('✅ All cron jobs stopped');
  }

  /**
   * Manually trigger attendance detection (for testing)
   */
  async triggerAttendanceDetection() {
    console.log('🔧 Manually triggering attendance detection...');
    return await mergeQueueController.detectMissingAttendance();
  }
}

module.exports = new CronScheduler();
