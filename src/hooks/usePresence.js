import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function usePresence(userId) {
  const [isOnline, setIsOnline] = useState(false);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const lastPosRef = useRef(null);

  const setPresence = useCallback(async (online, pos = null) => {
    if (!userId) return;
    
    const payload = {
      collector_id: userId,
      online,
      updated_at: new Date().toISOString(),
    };
    
    if (pos) {
      payload.lat = pos.lat;
      payload.lng = pos.lng;
    } else if (lastPosRef.current) {
      payload.lat = lastPosRef.current.lat;
      payload.lng = lastPosRef.current.lng;
    }

    try {
      await supabase.from('collector_presence').upsert(payload, { onConflict: 'collector_id' });
    } catch (err) {
      console.error('Failed to update presence', err);
    }
  }, [userId]);

  const goOffline = useCallback(() => {
    setIsOnline(false);
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPresence(false);
  }, [setPresence]);

  const goOnline = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsOnline(true);
    
    const handlePos = (position) => {
      const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
      lastPosRef.current = pos;
      setPresence(true, pos);
    };

    // 1) Initial position and watch movement
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePos,
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // 2) 20s heartbeat
    intervalRef.current = setInterval(() => {
      if (lastPosRef.current) {
        setPresence(true, lastPosRef.current);
      } else {
        navigator.geolocation.getCurrentPosition(handlePos);
      }
    }, 20000);
    
  }, [setPresence]);

  // Clear timers/watch on unmount (does not flip the DB row — that's goOffline's job)
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Flip online = false on beforeunload + visibilitychange (mobile)
  useEffect(() => {
    const markOffline = () => {
      if (!isOnline || !userId) return;
      // sendBeacon is more reliable than fetch in beforeunload
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const url = `${supabaseUrl}/rest/v1/collector_presence?collector_id=eq.${userId}`;
        const body = JSON.stringify({ online: false, updated_at: new Date().toISOString() });
        // fetch with keepalive survives page close like sendBeacon but supports custom headers
        try {
          fetch(url, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=minimal',
            },
            body,
            keepalive: true, // survives page close like sendBeacon
          });
        } catch {
          // last resort
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') markOffline();
    };

    window.addEventListener('beforeunload', markOffline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', markOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isOnline, userId]);

  return { isOnline, goOnline, goOffline };
}
