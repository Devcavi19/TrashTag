import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SELECT = '*, post_likes(user_id), profiles!author_id(name)'

function dbToApp(row) {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.profiles?.name ?? 'Someone',
    type: row.type,
    title: row.title,
    body: row.body,
    photoUrl: row.photo_url,
    eventDate: row.event_date,
    eventLocation: row.event_location,
    externalUrl: row.external_url,
    createdAt: row.created_at,
    likes: (row.post_likes || []).map((l) => l.user_id),
  }
}

async function fetchOne(id) {
  const { data } = await supabase.from('posts').select(SELECT).eq('id', id).single()
  return data ? dbToApp(data) : null
}

export function useFeed() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    supabase
      .from('posts')
      .select(SELECT)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setPosts(data.map(dbToApp))
      })

    const channel = supabase
      .channel('useFeed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          const added = await fetchOne(payload.new.id)
          if (added) {
            setPosts((prev) => [added, ...prev.filter((p) => p.id !== added.id)])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          if (payload.old?.id) {
            setPosts((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_likes' },
        (payload) => {
          const { post_id, user_id } = payload.new
          setPosts((prev) =>
            prev.map((p) =>
              p.id === post_id ? { ...p, likes: [...new Set([...p.likes, user_id])] } : p
            )
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_likes' },
        (payload) => {
          const { post_id, user_id } = payload.old
          if (post_id && user_id) {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === post_id
                  ? { ...p, likes: p.likes.filter((id) => id !== user_id) }
                  : p
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return [posts]
}
