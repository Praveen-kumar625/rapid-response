import { RedisService } from './redis.service';
import cron from 'node-cron';
import { fetchNOAAIncidents } from './feeds/noaa';
import { fetchUSGSIncidents } from './feeds/usgs';

export function scheduler(redis: RedisService) {
  // Run every minute
  cron.schedule('*/1 * * * *', async () => {
    try {
      await Promise.all([
        fetchNOAAIncidents(redis),
        fetchUSGSIncidents(redis),
      ]);
      console.log('✅ Feeds refreshed');
    } catch (e) {
      console.error('🚨 Feed error', e);
    }
  });
}
