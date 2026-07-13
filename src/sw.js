import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json()
      const title = data.title || 'New Pickup Request'
      const options = {
        body: data.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: {
          url: data.url || '/',
        },
      }

      event.waitUntil(self.registration.showNotification(title, options))
    } catch {
      event.waitUntil(
        self.registration.showNotification('New Request', {
          body: event.data.text(),
          icon: '/pwa-192x192.png',
        })
      )
    }
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus()
        }
      }
      // Or open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})
