import type { Page } from '../types'

type GalleryProps = {
  pages: Page[]
  onOpen: (index: number) => void
  onBack: () => void
}

export default function Gallery({ pages, onOpen, onBack }: GalleryProps) {
  return (
    <div className="gallery-page">
      <header className="page-header">
        <button className="secondary-btn" onClick={onBack}>Back</button>
        <h2>Choose a Coloring Page</h2>
      </header>

      <div className="gallery-grid">
        {pages.map((page, index) => (
          <article key={page.id} className="gallery-card">
            <img src={page.svg} alt={page.title} />
            <div className="gallery-meta">
              <span>{page.title}</span>
              <button className="small-btn" onClick={() => onOpen(index)}>
                Open
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
