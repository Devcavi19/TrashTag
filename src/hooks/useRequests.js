import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function dbToApp(row) {
  const tags = row.tags ?? []
  return {
    id: row.id,
    photo: row.photo_url,
    gps: row.location_label,
    lat: row.location_lat != null ? Number(row.location_lat) : null,
    lng: row.location_lng != null ? Number(row.location_lng) : null,
    tags,
    type: tags[0] ?? 'Biodegradable', // derived: single-accent consumers (Map/Chat)
    price: Number(row.price),
    status: row.status,
    postedAt: row.created_at,
    rating: row.rating, // poster's rating of the collector
    collectorRating: row.collector_rating, // collector's rating of the poster
    afterPhoto: row.after_photo_url,
    postedBy: row.poster_id,
    collectedBy: row.collected_by,
    likes: (row.request_likes || []).map((l) => l.user_id),
  }
}

async function fetchOne(id) {
  const { data } = await supabase
    .from('requests')
    .select('*, request_likes(user_id)')
    .eq('id', id)
    .single()
  return data ? dbToApp(data) : null
}

export function useRequests() {
  const [requests, setRequests] = useState([])
  const [realtimeStatus, setRealtimeStatus] = useState('CONNECTING')

  useEffect(() => {
    supabase
      .from('requests')
      .select('*, request_likes(user_id)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setRequests(data.map(dbToApp))
      })

    const channel = supabase
      .channel('useRequests')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'requests' },
        async (payload) => {
          const updated = await fetchOne(payload.new.id)
          if (updated) {
            setRequests((prev) => [updated, ...prev.filter((r) => r.id !== updated.id)])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests' },
        async (payload) => {
          const updated = await fetchOne(payload.new.id)
          if (updated) {
            setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'request_likes' },
        (payload) => {
          const { request_id, user_id } = payload.new
          setRequests((prev) =>
            prev.map((r) =>
              r.id === request_id
                ? { ...r, likes: [...new Set([...r.likes, user_id])] }
                : r
            )
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'request_likes' },
        (payload) => {
          const { request_id, user_id } = payload.old
          if (request_id && user_id) {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === request_id
                  ? { ...r, likes: r.likes.filter((id) => id !== user_id) }
                  : r
              )
            )
          }
        }
      )
      .subscribe((status) => setRealtimeStatus(status))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return [requests, realtimeStatus]
}
