import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer'

// Usage: node --experimental-modules scripts/generate-pdfs.mjs
// Make sure puppeteer is installed: npm install puppeteer

const repoRoot = process.cwd()
const artDir = path.join(repoRoot, 'public', 'art')
const outDir = path.join(repoRoot, 'dist', 'pdfs')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

// Order matches src/data/pages.ts (cover first)
const pages = [
  'cover.svg',
  'page1.svg',
  'page2.svg',
  'page3.svg',
  'page4.svg',
  'page5.svg',
  'page6.svg',
  'page7.svg',
  'page8.svg',
  'page9.svg',
  'page10.svg',
  'page11.svg',
  'page12.svg',
  'bonus-bucket.svg',
  'bonus-outfit.svg',
  'bonus-best-day.svg'
]

function loadSvg(name) {
  const p = path.join(artDir, name)
  if (!fs.existsSync(p)) {
    console.warn('Missing SVG:', name)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100"><rect width="100%" height="100%" fill="#fff"/><text x="50%" y="50%" text-anchor="middle" fill="#f00">Missing: ${name}</text></svg>`
  }
  return fs.readFileSync(p, 'utf8')
}

function buildHtmlForPages(svgList, pageSizeInches = { w: 8.5, h: 11 }, marginInches = 0.5) {
  // CSS sets the page size so puppeteer prints each .sheet as a separate page
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  @page { size: ${pageSizeInches.w}in ${pageSizeInches.h}in; margin: 0; }
  html,body{height:100%;margin:0;padding:0;background:#fff}
  .sheet{width:${pageSizeInches.w}in;height:${pageSizeInches.h}in;box-sizing:border-box;page-break-after:always;display:flex;align-items:center;justify-content:center}
  .content{width:calc(100% - ${marginInches*2}in);height:calc(100% - ${marginInches*2}in);display:flex;align-items:center;justify-content:center}
  .content svg{max-width:100%;max-height:100%}
</style>
</head>
<body>
${svgList.map(s => `<div class="sheet"><div class="content">${s}</div></div>`).join('\n')}
</body>
</html>`
}

async function generate(format, filename, pageSize) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()

  const svgList = pages.map(loadSvg)
  const html = buildHtmlForPages(svgList, pageSize, 0.5)

  await page.setContent(html, { waitUntil: 'networkidle0' })
  await page.emulateMediaType('screen')

  const outPath = path.join(outDir, filename)
  await page.pdf({ path: outPath, format, printBackground: true, margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' } })
  console.log('Wrote', outPath)

  await browser.close()
}

;(async () => {
  try {
    // Ensure we have at least placeholder pages for 12 pages + 3 bonus = 16 total
    // The repo may have fewer; missing ones become placeholder pages.

    await generate('Letter', 'how-i-spent-my-summer_US-Letter.pdf', { w: 8.5, h: 11 })
    await generate('A4', 'how-i-spent-my-summer_A4.pdf', { w: 8.27, h: 11.69 })

    console.log('PDF generation complete. Check dist/pdfs for output files.')
  } catch (err) {
    console.error('PDF generation failed', err)
    process.exit(1)
  }
})()
