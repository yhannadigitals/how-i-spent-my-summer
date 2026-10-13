import { useMemo, useState } from 'react'
import Cover from './components/Cover'
import Gallery from './components/Gallery'
import Reader from './components/Reader'
import { pages } from './data/pages'

export default function App() {
  const [view, setView] = useState<'home' | 'gallery' | 'reader'>('home')
  const [currentIndex, setCurrentIndex] = useState(0)

  const bookPages = useMemo(() => pages, [])

  const openPage = (index: number) => {
    setCurrentIndex(index)
    setView('reader')
  }

  return (
    <div className="app-shell">
      {view === 'home' && <Cover onStart={() => setView('gallery')} />}

      {view === 'gallery' && (
        <Gallery pages={bookPages} onOpen={openPage} onBack={() => setView('home')} />
      )}

      {view === 'reader' && (
        <Reader
          pages={bookPages}
          currentIndex={currentIndex}
          onChange={setCurrentIndex}
          onClose={() => setView('gallery')}
        />
      )}
    </div>
  )
}
