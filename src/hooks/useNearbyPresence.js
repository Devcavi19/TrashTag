import { useState, useEffect, useId } from 'react';
import { supabase } from '../lib/supabase';
import { haversineDistance } from '../utils/haversine';

const NEARBY_RADIUS_METERS = 5000;

function dbToApp(row) {
  return {
    collectorId: row.collector_id,
    lat: row.lat,
    lng: row.lng,
    online: row.online,
    updatedAt: row.updated_at,
  };
}

export function useNearbyPresence(centerLat, centerLng) {
  const [nearbyCollectors, setNearbyCollectors] = useState([]);
  // Unique per hook instance: DispatchHome and DispatchRadar can both have
  // this hook mounted at once, and Supabase throws if a second `.on(...)`
  // is added to an already-subscribed channel of the same name.
  const instanceId = useId();

  useEffect(() => {
    if (centerLat == null || centerLng == null) return;

    let cancelled = false;

    const fetchPresence = async () => {
      const { data, error } = await supabase
        .from('collector_presence')
        .select('*')
        .eq('online', true);

      if (!cancelled && !error && data) {
        const nearby = data
          .map(dbToApp)
          .filter((c) => c.lat != null && c.lng != null)
          .map((c) => ({ ...c, distance: haversineDistance(centerLat, centerLng, c.lat, c.lng) }))
          .filter((c) => c.distance <= NEARBY_RADIUS_METERS);
        setNearbyCollectors(nearby);
      }
    };

    fetchPresence();

    const channel = supabase
      .channel(`public:collector_presence:${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collector_presence' },
        () => {
          fetchPresence();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [centerLat, centerLng, instanceId]);

  return nearbyCollectors;
}
