// scripts/check.mjs: the website's checks. Run: node scripts/check.mjs
//
// Why: every change is checked before it reaches Cloudflare, the same rule
// as the app (Rhema CLAUDE.md section 11).
//
// What it checks:
//   1. Every picture, stylesheet and script the page names exists.
//   2. The testimonials content is valid, and every video link is one the
//      page can play (TikTok, YouTube, Instagram, https).
//   3. No pictures packed inside the page again (they slow every visit).
//   4. No em dashes in what visitors read (Anthony's rule).
//   5. The page has its title and description.
//
// Never: narrow a check to get green. The list only grows.
import { existsSync, readFileSync } from 'node:fs'

const problems = []
const page = readFileSync('public/index.html', 'utf8')

// ===== 1. Every file the page names exists =====
for (const [, path] of page.matchAll(/(?:src|href)="(\/[^"#?]+)"/g)) {
  if (!existsSync('public' + path)) problems.push(`missing file: ${path}`)
}

// ===== 2. The testimonials content =====
let content
try {
  content = JSON.parse(readFileSync('public/content/testimonials.json', 'utf8'))
} catch (e) {
  problems.push('content/testimonials.json is not valid JSON')
}
const playable = /^https:\/\/(www\.|m\.)?(tiktok\.com\/@[^/]+\/video\/\d+|youtube\.com\/(watch\?v=|shorts\/)[\w-]+|youtu\.be\/[\w-]+|instagram\.com\/(p|reel|tv)\/[\w-]+)/
for (const video of content?.videos ?? []) {
  if (!playable.test(String(video.url))) problems.push(`a video link the page cannot play: ${video.url}`)
}
for (const words of content?.words ?? []) {
  if (!words.quote || !String(words.quote).trim()) problems.push('a written testimonial with no words')
}

// ===== 3. No packed pictures =====
const packed = (page.match(/data:image\/(png|jpe?g|webp|gif);base64/g) ?? []).length
if (packed) problems.push(`${packed} pictures packed inside the page: keep them in public/img`)

// ===== 4. No em dashes in what visitors read =====
const words = page.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')
if (/—/.test(words) || /—/.test(JSON.stringify(content ?? {}))) problems.push('an em dash in the text')

// ===== 5. Title and description =====
if (!/<title>[^<]+<\/title>/.test(page)) problems.push('the page has no title')
if (!/<meta name="description" content="[^"]+"/.test(page)) problems.push('the page has no description')

if (problems.length) {
  console.log('WEBSITE CHECK FAILED')
  for (const p of problems) console.log('  ' + p)
  process.exit(1)
}
console.log('Website check passed.')
