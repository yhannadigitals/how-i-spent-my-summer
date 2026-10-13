import type { Page } from '../types'

export const pages: Page[] = [
  { id: 'cover', title: 'Cover', svg: '/art/cover.svg', printable: false },
  { id: 'adventure-begins', title: 'My Summer Adventure Begins!', svg: '/art/page1.svg', printable: true },
  { id: 'fun-under-the-sun', title: 'Fun Under the Sun', svg: '/art/page2.svg', printable: true },
  { id: 'beach-day-bliss', title: 'Beach Day Bliss', svg: '/art/page3.svg', printable: true },
  { id: 'camping-under-the-stars', title: 'Camping Under the Stars', svg: '/art/page4.svg', printable: true },
  { id: 'bucket-list', title: 'My Summer Bucket List', svg: '/art/bonus-bucket.svg', printable: true },
  { id: 'dream-outfit', title: 'Design Your Dream Summer Outfit', svg: '/art/bonus-outfit.svg', printable: true },
  { id: 'best-day', title: 'Draw and Write About My Best Summer Day', svg: '/art/bonus-best-day.svg', printable: true }
]
