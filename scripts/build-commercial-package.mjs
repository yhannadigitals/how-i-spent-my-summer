import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import puppeteer from 'puppeteer'

const root = process.cwd()
const artDir = path.join(root, 'public', 'art')
const outDir = path.join(root, 'dist', 'commercial')
const previewDir = path.join(outDir, 'previews')
const licenseDir = path.join(root, 'licenses')

fs.mkdirSync(outDir, { recursive: true })
fs.mkdirSync(previewDir, { recursive: true })
fs.mkdirSync(licenseDir, { recursive: true })

const sellerName = '[Your Name / Business Name]'

const titlePageSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
  <rect width="800" height="1100" fill="#ffffff"/>
  <text x="400" y="330" text-anchor="middle" font-size="44" font-family="Arial" fill="#1f2937">HOW I SPENT MY SUMMER</text>
  <text x="400" y="400" text-anchor="middle" font-size="28" font-family="Arial" fill="#374151">My Little Summer Adventures</text>
  <rect x="130" y="500" width="540" height="130" fill="#ffffff" stroke="#111827" stroke-width="4"/>
  <text x="400" y="580" text-anchor="middle" font-size="26" font-family="Arial" fill="#111827">This book belongs to: ______</text>
</svg>
`

const thankYouSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
  <rect width="800" height="1100" fill="#ffffff"/>
  <text x="400" y="420" text-anchor="middle" font-size="52" font-family="Arial" fill="#111827">Thank You</text>
  <text x="400" y="510" text-anchor="middle" font-size="36" font-family="Arial" fill="#374151">for coloring with me!</text>
  <text x="400" y="620" text-anchor="middle" font-size="24" font-family="Arial" fill="#4b5563">Have a bright, happy summer!</text>
</svg>
`

const personalUseLicense = `PERSONAL USE LICENSE

This coloring book is provided for personal and family use only.

You may:
- print the PDF for personal use
- use the pages for family coloring activities
- color the pages for your own enjoyment

You may NOT:
- redistribute the PDF files
- sell or resell the digital files
- share the files with other individuals or groups
- include the files in any commercial product or bundle
- upload the files to public sharing sites
- use the art in any product for sale without written permission

All original artwork is protected by copyright.
No resale or redistribution is permitted.

Seller Name: ${sellerName}
`

fs.writeFileSync(path.join(licenseDir, 'PERSONAL-USE-LICENSE.txt'), personalUseLicense.trim() + '\n')

function sortSvgFiles(files) {
  return files.sort((a, b) => {
    const na = a.toLowerCase()
    const nb = b.toLowerCase()
    const getOrder = (name) => {
      if (name.includes('cover')) return 0
      if (name.includes('page')) {
        const match = name.match(/page[-_]?([0-9]+)/i)
        if (match) return 100 + Number(match[1])
      }
      if (name.includes('bonus')) {
        const match = name.match(/bonus[-_]?([0-9]+)/i)
        if (match) return 300 + Number(match[1])
      }
      return 999
    }
    return getOrder(na) - getOrder(nb)
  })
}

function getArtSvgs() {
  const files = fs.readdirSync(artDir).filter((n) => n.toLowerCase().endsWith('.svg'))
  const sorted = sortSvgFiles(files)
  return sorted.map((name) => ({ name, content: fs.readFileSync(path.join(artDir, name), 'utf8') }))
}

function htmlForPdf(svgList, sizeLabel) {
  const pageSize = sizeLabel === 'A4' ? 'A4' : 'Letter'
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: ${pageSize}; margin: 0.4in; }
      body { margin: 0; background: #fff; }
      .page { page-break-after: always; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
      .page:last-child { page-break-after: auto; }
      .page svg { max-width: 100%; max-height: 100%; display: block; }
    </style>
  </head>
  <body>
    ${svgList.map((svg) => `<div class="page">${svg}</div>`).join('\n')}
  </body>
</html>`
}

async function renderPdf(name, sizeLabel, svgList) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(htmlForPdf(svgList, sizeLabel), { waitUntil: 'networkidle0' })
  await page.pdf({
    path: path.join(outDir, name),
    format: sizeLabel === 'A4' ? 'A4' : 'Letter',
    printBackground: true,
    margin: { top: '0.4in', right: '0.4in', bottom: '0.4in', left: '0.4in' }
  })
  await browser.close()
}

async function renderPreviewImages(artSvgs) {
  const cover = artSvgs.find((x) => x.name.toLowerCase().includes('cover'))
  if (cover) {
    await sharp(Buffer.from(cover.content))
      .resize(2000, 2000, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(previewDir, 'cover-2000x2000.png'))
  }

  const previewSource = artSvgs.filter((x) => !x.name.toLowerCase().includes('cover')).slice(0, 4)
  for (let i = 0; i < previewSource.length; i++) {
    await sharp(Buffer.from(previewSource[i].content))
      .resize(1800, 2400, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(previewDir, `preview-${i + 1}.png`))
  }
}

async function main() {
  const artSvgs = getArtSvgs()
  const cover = artSvgs.find((item) => item.name.toLowerCase().includes('cover'))
  const pageFiles = artSvgs.filter((item) => !item.name.toLowerCase().includes('cover'))

  const svgList = [
    ...(cover ? [cover.content] : []),
    titlePageSvg,
    ...pageFiles.map((item) => item.content),
    thankYouSvg
  ]

  await renderPdf('How-I-Spent-My-Summer-US-Letter.pdf', 'Letter', svgList)
  await renderPdf('How-I-Spent-My-Summer-A4.pdf', 'A4', svgList)
  await renderPreviewImages(artSvgs)

  console.log('Commercial package generated at:', outDir)
  console.log('Preview images:', previewDir)
  console.log('License saved to:', path.join(licenseDir, 'PERSONAL-USE-LICENSE.txt'))
}

main().catch((error) => {
  console.error('Commercial package generation failed:', error)
  process.exit(1)
})
