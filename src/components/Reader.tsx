import { useEffect, useMemo, useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import type { Page } from '../types'
import ColoringCanvas from './ColoringCanvas'

type ReaderProps = {
  pages: Page[]
  currentIndex: number
  onChange: (index: number) => void
  onClose: () => void
}

export default function Reader({ pages, currentIndex, onChange, onClose }: ReaderProps) {
  const [index, setIndex] = useState(currentIndex)
  const [printMode, setPrintMode] = useState(false)
  const currentPage = useMemo(() => pages[index], [pages, index])

  useEffect(() => {
    setIndex(currentIndex)
  }, [currentIndex])

  const goPrev = () => {
    if (index === 0) return
    const nextIndex = index - 1
    setIndex(nextIndex)
    onChange(nextIndex)
  }

  const goNext = () => {
    if (index >= pages.length - 1) return
    const nextIndex = index + 1
    setIndex(nextIndex)
    onChange(nextIndex)
  }

  const downloadPdf = async () => {
    const printablePages = pages.filter((page) => page.printable)
    const pdf = new jsPDF({
      unit: 'in',
      format: 'letter',
      orientation: 'portrait'
    })

    for (let i = 0; i < printablePages.length; i += 1) {
      if (i > 0) pdf.addPage()

      const img = new Image()
      img.src = printablePages[i].svg
      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
      })

      const maxW = 7.2
      const scale = maxW / img.width
      const height = img.height * scale

      pdf.addImage(img, 'PNG', 0.55, 0.7, maxW, height)
      pdf.setFontSize(10)
      pdf.text(`${i + 1}`, 7.4, 10.65)
    }

    pdf.save('how-i-spent-my-summer.pdf')
  }

  const printPage = () => {
    setPrintMode(true)
    window.print()
    setTimeout(() => setPrintMode(false), 500)
  }

  return (
    <div className="reader-page">
      <header className="reader-header">
        <button className="secondary-btn" onClick={onClose}>Back to gallery</button>

        <div className="reader-title-wrap">
          <p>Page {index + 1}</p>
          <h2>{currentPage.title}</h2>
        </div>

        <div className="reader-actions">
          <button className="secondary-btn" onClick={downloadPdf}>Download PDF</button>
          <button className="primary-btn" onClick={printPage}>Print This Page</button>
        </div>
      </header>

      <div className={`reader-body ${printMode ? 'print-mode' : ''}`}>
        <div className="nav-stack">
          <button className="big-btn" onClick={goPrev} disabled={index === 0}>Previous</button>
          <button className="big-btn" onClick={goNext} disabled={index === pages.length - 1}>Next</button>
        </div>

        <div className="page-stage">
          <div className="page-sheet">
            <div className="page-sheet-header">{currentPage.title}</div>
            <ColoringCanvas page={currentPage} />
          </div>
        </div>
      </div>
    </div>
  )
}
