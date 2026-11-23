/*
 * testimonials.js: the Testimonials section: a ring of video cards and the
 * written testimonials (request 228, 2026-11-23).
 *
 * Why: Anthony: "a ring rotating. So you can click on each of the
 * thumbnail, it will stop, the video will play. You can rotate it again...
 * testimonial text will still be there as well." Videos from TikTok,
 * YouTube or Instagram play on this page, in that service's own player,
 * without leaving the website.
 *
 * How it goes:
 *   1. Read content/testimonials.json (later: what admins publish in the
 *      app, Menu, Website). Nothing real yet: the section stays hidden.
 *   2. Each video becomes a card on the ring: its cover photo, a play sign,
 *      a title. The ring turns slowly, follows a drag, the arrow keys, and
 *      (on a computer) the page scroll.
 *   3. Tap a card: the ring stops and the video plays over the page. Close
 *      it: the ring turns again.
 *   4. The written testimonials sit under the ring as cards.
 *
 * Never: put a typed word into the page as code (only as plain text), or
 * play a link from anywhere but TikTok, YouTube or Instagram.
 */
;(function () {
  'use strict'

  // ===== 1. Which links can play here, and how =====
  // Answers { src, wide, cover } for a link we can play, or null.
  function playerFor(link) {
    var url
    try {
      url = new URL(link)
    } catch (e) {
      return null
    }
    if (url.protocol !== 'https:') return null
    var host = url.hostname.replace(/^www\./, '').replace(/^m\./, '')
    var match
    if (host === 'tiktok.com') {
      match = url.pathname.match(/\/video\/(\d{6,25})/)
      if (match) return { src: 'https://www.tiktok.com/player/v1/' + match[1] + '?autoplay=1&rel=0', wide: false }
    }
    if (host === 'youtube.com' || host === 'youtu.be') {
      var id =
        host === 'youtu.be'
          ? url.pathname.slice(1)
          : url.searchParams.get('v') || (url.pathname.match(/\/(?:shorts|embed)\/([\w-]{6,20})/) || [])[1]
      if (id && /^[\w-]{6,20}$/.test(id))
        return {
          src: 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0',
          wide: url.pathname.indexOf('/shorts/') !== 0,
          cover: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg',
        }
    }
    if (host === 'instagram.com') {
      match = url.pathname.match(/\/(p|reel|tv)\/([\w-]{5,40})/)
      if (match) return { src: 'https://www.instagram.com/' + match[1] + '/' + match[2] + '/embed', wide: false }
    }
    return null
  }

  // A cover photo address we accept: https only.
  function safeImage(link) {
    try {
      var url = new URL(link, location.href)
      return url.protocol === 'https:' || url.origin === location.origin ? url.href : null
    } catch (e) {
      return null
    }
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag)
    if (cls) node.className = cls
    if (text) node.textContent = text
    return node
  }

  // ===== 2. The player over the page =====
  var player, frame, playerTitle, lastFocus, onPlayerClose
  function buildPlayer() {
    player = el('div', 'tplayer')
    player.hidden = true
    player.setAttribute('role', 'dialog')
    player.setAttribute('aria-modal', 'true')
    player.setAttribute('aria-label', 'Video')
    var box = el('div', 'tplayer-box')
    var close = el('button', 'tplayer-close', 'Close')
    close.type = 'button'
    playerTitle = el('p', 'tplayer-title')
    frame = el('iframe', 'tplayer-frame')
    frame.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen')
    frame.setAttribute('allowfullscreen', '')
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
    frame.title = 'Video'
    box.append(close, frame, playerTitle)
    player.append(box)
    document.body.append(player)
    close.addEventListener('click', closePlayer)
    player.addEventListener('click', function (e) {
      if (e.target === player) closePlayer()
    })
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !player.hidden) closePlayer()
    })
  }
  function openPlayer(video, done) {
    lastFocus = document.activeElement
    onPlayerClose = done
    frame.className = 'tplayer-frame' + (video.play.wide ? ' wide' : '')
    frame.src = video.play.src
    playerTitle.textContent = video.title || ''
    player.hidden = false
    player.querySelector('.tplayer-close').focus()
  }
  function closePlayer() {
    // Clearing the address stops the sound at once.
    frame.src = 'about:blank'
    player.hidden = true
    if (lastFocus) lastFocus.focus()
    if (onPlayerClose) onPlayerClose()
  }

  // ===== 3. The ring =====
  function buildRing(view, videos, caption) {
    var ring = el('div', 'tring')
    view.append(ring)
    // A full ring needs at least 8 cards; a few videos are repeated round
    // it, so the circle always looks complete. Slot i shows video i % n.
    var n = videos.length
    var count = Math.max(8, n)
    while (count % n) count += 1
    var slots = []
    for (var s = 0; s < count; s += 1) slots.push(videos[s % n])
    var step = 360 / count
    var cards = slots.map(function (video, i) {
      var card = el('button', 'tcard')
      card.type = 'button'
      card.setAttribute('aria-label', 'Play: ' + (video.title || 'video ' + ((i % n) + 1)))
      // The repeats are hidden from screen readers: each video is read once.
      if (i >= n) card.setAttribute('aria-hidden', 'true'), (card.tabIndex = -1)
      if (video.cover) {
        var img = el('img')
        img.src = video.cover
        img.alt = ''
        img.loading = 'lazy'
        img.decoding = 'async'
        card.append(img)
      }
      card.append(el('span', 'tplay'))
      var cap = el('span', 'tcap')
      if (video.title) cap.append(el('b', null, video.title))
      if (video.who) cap.append(el('small', null, video.who))
      card.append(cap)
      ring.append(card)
      return card
    })

    var radius = 0
    function size() {
      var width = cards[0].offsetWidth
      radius = Math.round((width / 2 / Math.tan(Math.PI / count)) * 1.12)
      cards.forEach(function (card, i) {
        card.style.transform = 'rotateY(' + i * step + 'deg) translateZ(' + radius + 'px)'
      })
    }
    size()
    var lastWidth = innerWidth
    addEventListener('resize', function () {
      if (innerWidth !== lastWidth) {
        lastWidth = innerWidth
        size()
      }
    })

    var still = matchMedia('(prefers-reduced-motion: reduce)').matches
    var touch = matchMedia('(pointer: coarse)').matches
    var angle = 0
    var target = 0
    var paused = false
    var lastScroll = scrollY
    var front = -1
    function frontIndex() {
      var turned = (((target % 360) + 360) % 360) / step
      return Math.round(turned) % count
    }
    function show() {
      var i = frontIndex()
      if (i !== front) {
        front = i
        var v = slots[i]
        caption.textContent = [v.title, v.who].filter(Boolean).join(' · ')
      }
    }
    function tick() {
      var rect = view.getBoundingClientRect()
      var inView = rect.bottom > 0 && rect.top < innerHeight
      if (inView && !paused) {
        if (!still) {
          target += 0.05
          if (!touch) target += (scrollY - lastScroll) * 0.12
        }
        angle += (target - angle) * 0.08
        ring.style.transform = 'translateZ(' + -radius + 'px) rotateY(' + -angle + 'deg)'
        // Cards facing away are hidden; the ones at the sides fade, so the
        // front card stands out and nothing shows through mirrored.
        cards.forEach(function (card, i) {
          var facing = Math.cos(((i * step - angle) * Math.PI) / 180)
          card.style.visibility = facing > 0.05 ? 'visible' : 'hidden'
          card.style.opacity = String(Math.max(0, Math.min(1, 0.25 + facing * 0.75)))
        })
        show()
      }
      lastScroll = scrollY
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    // Drag to turn; a short tap plays the card under the finger.
    var down = null
    view.addEventListener('pointerdown', function (e) {
      down = { x: e.clientX, start: target, moved: false }
    })
    addEventListener('pointermove', function (e) {
      if (!down) return
      var dx = e.clientX - down.x
      if (Math.abs(dx) > 6) down.moved = true
      target = down.start - dx * 0.35
    })
    addEventListener('pointerup', function () {
      setTimeout(function () {
        down = null
      }, 0)
    })
    view.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') target += step
      else if (e.key === 'ArrowLeft') target -= step
      else if (e.key === 'Enter') play(frontIndex())
      else return
      e.preventDefault()
    })

    function play(i) {
      paused = true
      openPlayer(slots[i], function () {
        paused = false
      })
    }
    cards.forEach(function (card, i) {
      card.addEventListener('click', function (e) {
        if (down && down.moved) {
          e.preventDefault()
          return
        }
        play(i)
      })
    })
  }

  // ===== 4. The written testimonials =====
  function buildWords(list, words) {
    words.forEach(function (w) {
      var fig = el('figure', 'tword')
      fig.append(el('blockquote', null, w.quote))
      var cap = el('figcaption')
      if (w.who) cap.append(el('b', null, w.who))
      if (w.role) cap.append(document.createTextNode((w.who ? ', ' : '') + w.role))
      fig.append(cap)
      list.append(fig)
    })
    list.hidden = false
  }

  // ===== 5. Start: read the content, then show what is real =====
  function start(content) {
    var section = document.getElementById('testimonials')
    if (!section) return
    var videos = (content.videos || [])
      .map(function (v) {
        var play = playerFor(String(v.url || ''))
        if (!play) return null
        var cover = v.cover ? safeImage(String(v.cover)) : play.cover || null
        return {
          play: play,
          cover: cover,
          title: v.title ? String(v.title).slice(0, 80) : '',
          who: v.who ? String(v.who).slice(0, 80) : '',
        }
      })
      .filter(Boolean)
      .slice(0, 12)
    var words = (content.words || [])
      .filter(function (w) {
        return w && typeof w.quote === 'string' && w.quote.trim()
      })
      .map(function (w) {
        return {
          quote: w.quote.trim().slice(0, 600),
          who: w.who ? String(w.who).slice(0, 80) : '',
          role: w.role ? String(w.role).slice(0, 80) : '',
        }
      })
      .slice(0, 12)
    if (!videos.length && !words.length) return
    section.hidden = false
    var link = document.querySelector('a[data-nav="testimonials"]')
    if (link) link.hidden = false
    if (videos.length) {
      buildPlayer()
      section.querySelector('.tring-block').hidden = false
      buildRing(section.querySelector('.tring-view'), videos, section.querySelector('.tring-caption'))
    }
    if (words.length) buildWords(section.querySelector('.twords'), words)
  }

  // The content file; a test can hand its own in (window.RHEMA_TESTIMONIALS).
  if (window.RHEMA_TESTIMONIALS) start(window.RHEMA_TESTIMONIALS)
  else
    fetch('/content/testimonials.json', { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.json() : {}
      })
      .then(start)
      .catch(function () {})
})()
