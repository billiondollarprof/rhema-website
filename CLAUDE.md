# CLAUDE.md

The rules for the Rhema Medical Centre website (web.rhemamedical.app),
built by StellaXafe Technologies Limited for Anthony.

**The rules of the Rhema app apply here too**, word for word:
`billiondollarprof/rhema`, file `CLAUDE.md` (how to talk to Anthony, he is
in charge, one task at a time, nothing is done until it has been used,
screenshots at phone and desktop widths, light and dark, no em dashes).
These lines only add what is particular to the website.

## The website

- **Plain files** in `public/`: `index.html`, `testimonials.js` and
  `testimonials.css`, pictures in `public/img/`, content in
  `public/content/`. No build step.
- **Hosted on the hospital's Cloudflare account** (Anthony, 2026-11-23: not
  Vercel). `testing` deploys to web-testing.rhemamedical.app, `main` to
  web.rhemamedical.app (`.github/workflows/deploy.yml`).
- **`node scripts/check.mjs`** before every push. CI runs the same.
- **Real content only.** No made-up testimonial, review, doctor or number on
  a public page. A testimonial or a patient's video needs the person's
  written permission (Nigeria Data Protection Act 2023). Staff photos need
  each person's agreement.
- **No patient data ever.** The website may show general facts from the app
  (departments, services), never a record.
- **Testimonials** (request 228): videos from TikTok, YouTube or Instagram
  on a turning ring, played on the page in the service's own player, and
  written testimonials under it. Until admins publish from the app (Menu,
  Website), they come from `public/content/testimonials.json`. Empty: the
  section stays hidden.
- **Anything typed by staff goes onto the page as plain text**, never as
  code (`textContent`, never `innerHTML`).

## Branches

Work on `claude/rema-project-planning-1yjeo1`, push it to `testing`, check
web-testing.rhemamedical.app, then `main`. Merge `main` back into
`testing` after anything lands on `main`.
