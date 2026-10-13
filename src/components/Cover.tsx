type CoverProps = {
  onStart: () => void
}

export default function Cover({ onStart }: CoverProps) {
  return (
    <main className="cover-page">
      <div className="cover-card">
        <div className="cover-illustration">
          <img src="/art/cover.svg" alt="How I Spent My Summer cover illustration" />
        </div>

        <div className="cover-text">
          <p className="eyebrow">My Little Summer Adventures</p>
          <h1>HOW I SPENT MY SUMMER</h1>
          <button className="primary-btn" onClick={onStart}>Start My Adventure</button>
        </div>
      </div>
    </main>
  )
}
