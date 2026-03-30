import axios from 'axios';
import { RedisService } from '../redis.service';
import { v4 as uuidv4 } from 'uuid';
import { Incident } from '@rapid-response/contracts';

export async function fetchNOAAIncidents(redis: RedisService) {
  const url = 'https://api.weather.gov/alerts/active';
  const resp = await axios.get(url, { timeout: 5000 });
  const features = resp.data.features as any[];

  for (const f of features) {
    const props = f.properties;
    const externalId = props.id;
    // Simple dedup logic – skip if we already broadcast this ID
    // (In production store a hash in Redis SET)
    const already = await redis.client.sismember('noaa:processed', externalId);
    if (already) continue;

    const severityMap: Record<string, number> = {
      Minor: 1,
      Moderate: 2,
      Severe: 3,
      Extreme: 4,
    };
    const severity = severityMap[props.severity] ?? 2;

    const geometry = f.geometry;
    const [lng, lat] =
      geometry.type === 'Point'
        ? geometry.coordinates
        : // get centroid for polygon via turf (lightweight)
          require('@turf/centroid')(f).geometry.coordinates;

    const incident: Incident = {
      id: uuidv4(),
      title: props.event,
      description: props.headline,
      severity,
      category: props.event.toUpperCase(),
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      reportedBy: 'NOAA_FEED',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      externalId,
    };

    // Publish to Redis (same channel as API)
    await redis.publish('incidents', JSON.stringify({ type: 'created', incident }));
    // Mark as processed
    await redis.client.sadd('noaa:processed', externalId);
  }
}
