(() => {
  const api = window.CL_BERGER_API_URL || 'http://localhost:5000/api/v1'
  const q = (selector, root = document) => root.querySelector(selector)
  const h = (tag, className, text) => { const el = document.createElement(tag); 
                                       if (className) el.className = className; 
                                       if (text) el.textContent = text; return el 
                                      }

  function removePublicTestimonialForm() {
    document.querySelectorAll('.testimonial-share, .testimonial-form').forEach(node => node.remove())
    document.querySelectorAll('h2,h3').forEach(heading => {
      if (heading.textContent.trim().toLowerCase() === 'share your experience') heading.closest('section,article,div')?.remove()
    })
  }

  function ensureTestimonials() {
    const landing = q('main.landing')
    if (!landing) return
    let page = q('#testimonials', landing)
    if (!page) {
      page = h('section', 'announcements-section testimonials-page')
      page.id = 'testimonials'
      page.innerHTML = '<header class="community-heading"><div><div class="eyebrow"><span></span> STORIES IN HARMONY</div><h2>Testimonials</h2><p>Personal stories from people whose lives have been touched by Chorale Le Bon Berger.</p></div><div class="announcement-mark" aria-hidden="true">“</div></header><div class="testimonial-preview-note" hidden>Demo cards for layout preview — replace with real stories as members share them.</div><div class="announcement-grid testimonial-grid" aria-live="polite"></div><div class="testimonial-empty">Your story could be the first one shared here. Approved testimonials will appear on this page.</div>'
      const signIn = q('.signin', landing)
      landing.insertBefore(page, signIn || q('.site-footer', landing))
    }
    return page
  }

  const featuredTestimonials = [
    { id: 'featured-calixte', author_name: 'TWAGIRAMUKIZA Calixte', relationship: 'Choir member', story: 'Chorale Le Bon Berger is a family where everyone belongs.', photo: '/testimonials/TWAGIRAMUKIZA-Calixte.jpeg' },
    { id: 'featured-lorger', author_name: 'Niwemugenga Lorger', relationship: 'Choir member', story: 'We live in worship, happiness, and peace together.', photo: '/testimonials/Niwemugenga-Lorger.png' },
    { id: 'featured-paul', author_name: 'RUKUNDO Paul', relationship: 'Choir member', story: 'We support one another as one choir family.', photo: '/testimonials/RUKUNDO-Paul.jpeg' },
    { id: 'featured-sylvestre', author_name: 'Sylvestre TURAMYENYIRIJURU', relationship: 'Choir President', story: 'Worship brings us together in joy and peace.', photo: '/testimonials/Sylvestre-TURAMYENYIRIJURU.jpeg', featured: true },
    { id: 'featured-vivence', author_name: 'IRAGENA Vivence', relationship: 'Choir member', story: 'Everyone has a place, and we encourage one another.', photo: '/testimonials/IRAGENA-Vivence.jpeg' },
  ]

  function renderTestimonials(rows) {
    const page = q('#testimonials')
    if (!page) return
    const grid = q('.testimonial-grid', page)
    const empty = q('.testimonial-empty', page)
    grid.replaceChildren()
    const featuredNames = new Set(featuredTestimonials.map(row => row.author_name.trim().toLocaleLowerCase()))
    const displayRows = [...featuredTestimonials, ...rows.filter(row => !featuredNames.has((row.author_name || '').trim().toLocaleLowerCase()))]
    const previewNote = q('.testimonial-preview-note', page)
    if (previewNote) previewNote.hidden = true
    displayRows.forEach((row, index) => {
      const card = h('article', 'announcement-card testimonial-card')
      if (row.featured) card.classList.add('testimonial-card-center')
      card.style.setProperty('--testimonial-index', index)
      const mark = h('span', 'testimonial-quote-mark', '“')
      const story = h('p', 'testimonial-story', row.story)
      const author = h('h3', '', row.author_name)
      const relation = h('small', 'testimonial-author-detail', row.relationship || 'Chorale Le Bon Berger community')
      const person = h('div', 'testimonial-person')
      const imageUrl = row.photo || (row.photo_url ? (row.photo_url.startsWith('http') ? row.photo_url : `${api.replace(/\/api\/v1$/, '')}${row.photo_url}`) : null)
      if (imageUrl) {
        const photo = h('img', 'testimonial-photo')
        photo.src = imageUrl
        photo.alt = `Portrait of ${row.author_name}`
        photo.loading = 'lazy'
        card.append(photo)
      } else {
        person.append(h('span', 'testimonial-initial', (row.author_name || 'A').trim().charAt(0).toUpperCase()))
      }
      const attribution = h('div', 'testimonial-attribution')
      attribution.append(author, relation)
      person.append(attribution)
      card.append(mark, story)
      card.append(person)
      grid.append(card)
    })
    empty.hidden = displayRows.length > 0
    if (grid._cardObserver) grid._cardObserver.disconnect()
    if ('IntersectionObserver' in window) {
      grid._cardObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          grid._cardObserver.unobserve(entry.target)
        }
      }), {threshold: 0.12})
      grid.querySelectorAll('.testimonial-card').forEach(card => grid._cardObserver.observe(card))
    } else grid.querySelectorAll('.testimonial-card').forEach(card => card.classList.add('in-view'))
  }

  async function loadTestimonials() {
    ensureTestimonials()
    try {
      const response = await fetch(`${api}/testimonials`)
      if (!response.ok) throw new Error('Unable to load testimonials.')
      const data = await response.json()
      renderTestimonials(data.testimonials || [])
    } catch {
      const page = q('#testimonials')
      if (page) q('.testimonial-empty', page).textContent = 'Testimonials are temporarily unavailable. Please try again later.'
    }
  }

  function reorderLanding() {
    const landing = q('main.landing')
    if (!landing) return
    const navLinks = q('.nav-links', landing)
    if (navLinks && !navLinks.dataset.sorted) {
      const links = [
        ['#home', 'Home'], ['#about', 'About'], ['#members', 'Members'],
        ['#announcements', 'Announcements'], ['#events', 'Events'], ['#gallery', 'Gallery'],
        ['#songs', 'Songs in PDF'], ['#testimonials', 'Testimonials'], ['#signin', 'Sign in'],
      ]
      navLinks.replaceChildren(...links.map(([href, label]) => {
        const a = h('a', href === '#signin' ? 'nav-login' : '', label)
        a.href = href
        a.addEventListener('click', () => q('.menu', landing)?.click())
        return a
      }))
      navLinks.dataset.sorted = 'true'
    }
    const about = q('#about', landing)
    if (about && !about.dataset.aboutRedesigned) {
      about.classList.add('about-us-section')
      about.replaceChildren()
      const intro = h('header', 'about-intro')
      intro.innerHTML = '<div class="eyebrow"><span></span> GET TO KNOW US</div><h2>About Us</h2><p>A</p>'
      const grid = h('div', 'about-content-grid')
      const divisions = [
        ['Our History', 'A'],
        ['Our Mission', 'A'],
        ['Choir Community', 'A'],
      ]
      divisions.forEach(([title, copy], index) => {
        const card = h('article', 'about-content-card')
        card.append(h('span', 'about-card-letter', 'A'), h('small', '', `DIVISION 0${index + 1}`), h('h3', '', title), h('p', '', copy))
        grid.append(card)
      })
      about.append(intro, grid)
      about.dataset.aboutRedesigned = 'true'
    }
    const homeWelcome = q('.home-welcome', landing)
    if (homeWelcome && !q('.home-section-label', homeWelcome)) {
      const label = h('span', 'home-section-label', 'HOME')
      homeWelcome.prepend(label)
    }
    const president = q('#president', landing)
    if (president && !q('.president-section-heading', president)) {
      const title = h('header', 'president-section-heading')
      title.innerHTML = '<div class="eyebrow"><span></span> OUR LEADERSHIP</div><h2>President & Welcome</h2>'
      president.prepend(title)
    }
    const signIn = q('.signin-copy', landing)
    if (signIn && !q('.signin-section-label', signIn)) {
      signIn.prepend(h('span', 'signin-section-label', 'MEMBER SIGN IN'))
    }
    const loginCard = q('#signin', landing)
    if (loginCard && !q('.signin-card-title', loginCard)) {
      loginCard.prepend(h('h2', 'signin-card-title', 'Sign In'))
    }
    const page = ensureTestimonials()
    const ids = ['home', 'about', 'president', 'leadership', 'members', null, 'announcements', 'events', 'gallery', 'songs', 'testimonials', 'signin']
    const birthday = q('.birthday-section', landing)
    const byId = id => id === 'signin' ? q('#signin', landing)?.closest('.signin') : id ? q(`#${id}`, landing) : birthday
    const ordered = ids.map(byId).filter(Boolean)
    const footer = q('.site-footer', landing)
    const currentOrder = [...landing.children].filter(node => ordered.includes(node))
    const alreadyOrdered = currentOrder.length === ordered.length && currentOrder.every((node, index) => node === ordered[index])
    if (!alreadyOrdered) ordered.forEach(node => landing.insertBefore(node, footer || null))
    if (page && !page.dataset.loaded) {
      page.dataset.loaded = 'true'
      loadTestimonials()
    }
  }

  function ensureBackToTop() {
    let button = q('.back-to-top')
    if (!button) {
      button = h('button', 'back-to-top', '↑')
      button.type = 'button'
      button.setAttribute('aria-label', 'Back to top')
      button.title = 'Back to top'
      button.addEventListener('click', () => window.scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}))
      document.body.append(button)
      const update = () => button.classList.toggle('is-visible', window.scrollY > 360)
      window.addEventListener('scroll', update, {passive: true})
      update()
    }
  }

  async function authorized(url, options = {}) {
    const send = token => fetch(`${api}${url}`, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` } })
    let token = sessionStorage.getItem('access_token')
    let response = await send(token)
    if (response.status === 401) {
      const refresh = sessionStorage.getItem('refresh_token')
      if (!refresh) return response
      const refreshed = await fetch(`${api}/auth/refresh`, { method: 'POST', headers: { Authorization: `Bearer ${refresh}` } })
      if (!refreshed.ok) return response
      token = (await refreshed.json()).access_token
      sessionStorage.setItem('access_token', token)
      response = await send(token)
    }
    return response
  }

  async function showTestimonialWorkspace(main) {
    const nav = q('.workspace-nav')
    if (!nav) return
    let panel = q('.testimonial-admin-panel', main)
    if (!panel) {
      panel = h('section', 'role-panel testimonial-admin-panel')
      panel.innerHTML = '<div class="eyebrow"><span></span> COMMUNITY VOICES</div><h2>Testimonials</h2><p>Add a member’s full name, portrait, and message. Publishing here adds it to the public Testimonials page.</p><form class="testimonial-admin-form"><label>Full name<input name="author_name" maxlength="120" autocomplete="name" required></label><label>Portrait photo<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required><small>JPG, PNG or WEBP · up to 5 MB</small></label><label>Message<textarea name="story" minlength="1" maxlength="2000" rows="4" required></textarea></label><div class="testimonial-form-actions"><button type="submit">Publish testimonial</button><button class="testimonial-cancel-edit" type="button" hidden>Cancel edit</button></div></form><p class="testimonial-admin-feedback" role="status"></p><h3 class="testimonial-admin-subheading">Submitted stories</h3><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Full name</th><th>Message</th><th>Status</th><th>Action</th></tr></thead><tbody></tbody></table></div>'
      main.append(panel)
    }
    panel.hidden = false
    ;[...main.children].forEach(child => { if (child !== panel && !child.matches('.workspace-topbar')) child.hidden = true })
    const body = q('tbody', panel)
    const feedback = q('.testimonial-admin-feedback', panel)
    const form = q('.testimonial-admin-form', panel)
    const photoInput = q('input[name="photo"]', form)
    const submitButton = q('button[type="submit"]', form)
    const cancelEditButton = q('.testimonial-cancel-edit', form)
    const resetForm = () => {
      form.reset()
      delete form.dataset.editId
      photoInput.required = true
      submitButton.textContent = 'Publish testimonial'
      cancelEditButton.hidden = true
    }
    if (!form.dataset.bound) {
      form.dataset.bound = 'true'
      cancelEditButton.addEventListener('click', resetForm)
      form.addEventListener('submit', async event => {
        event.preventDefault()
        const editingId = form.dataset.editId
        submitButton.disabled = true
        feedback.textContent = editingId ? 'Saving testimonial changes…' : 'Publishing testimonial…'
        try {
          const result = editingId
            ? await authorized(`/admin/testimonials/${editingId}`, { method: 'PATCH', body: new FormData(form) })
            : await authorized('/admin/testimonials', { method: 'POST', body: new FormData(form) })
          const data = await result.json()
          if (!result.ok) throw new Error(data.error || (editingId ? 'Could not update testimonial.' : 'Could not publish testimonial.'))
          resetForm()
          feedback.textContent = data.message
          loadTestimonials()
          await showTestimonialWorkspace(main)
          feedback.textContent = data.message
        } catch (error) { feedback.textContent = error.message }
        finally { submitButton.disabled = false }
      })
    }
    try {
      const response = await authorized('/admin/testimonials')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not load testimonials.')
      body.replaceChildren()
      ;(data.testimonials || []).forEach(row => {
        const tr = document.createElement('tr')
        const cells = [row.author_name, row.story, row.status]
        cells.forEach((value, index) => { const td = h(index === 0 ? 'th' : 'td', index === 1 ? 'table-long-text' : '', value); tr.append(td) })
        const actions = h('td', 'table-actions')
        const editButton = h('button', 'testimonial-edit-button', '✎ Edit')
        editButton.type = 'button'
        editButton.addEventListener('click', () => {
          form.dataset.editId = row.id
          q('input[name="author_name"]', form).value = row.author_name || ''
          q('textarea[name="story"]', form).value = row.story || ''
          photoInput.value = ''
          photoInput.required = false
          submitButton.textContent = 'Save changes'
          cancelEditButton.hidden = false
          feedback.textContent = `Editing ${row.author_name}. Choose a new photo only if you want to replace the current one.`
          form.scrollIntoView({ behavior: 'smooth', block: 'center' })
        })
        actions.append(editButton)
        const deleteButton = h('button', 'reject-button testimonial-delete-button', '⌫ Delete')
        deleteButton.type = 'button'
        deleteButton.addEventListener('click', async () => {
          if (!window.confirm(`Delete the testimonial from ${row.author_name}? This also removes its uploaded portrait.`)) return
          deleteButton.disabled = true
          try {
            const answer = await authorized(`/admin/testimonials/${row.id}`, { method: 'DELETE' })
            const result = await answer.json()
            if (!answer.ok) throw new Error(result.error || 'Could not delete testimonial.')
            if (form.dataset.editId === String(row.id)) resetForm()
            feedback.textContent = result.message
            loadTestimonials()
            await showTestimonialWorkspace(main)
            feedback.textContent = result.message
          } catch (error) { feedback.textContent = error.message; deleteButton.disabled = false }
        })
        actions.append(deleteButton)
        if (row.status === 'pending') {
          for (const decision of ['approve', 'reject']) {
            const button = h('button', decision === 'reject' ? 'reject-button' : '', decision === 'approve' ? 'Approve' : 'Reject')
            button.type = 'button'
            button.addEventListener('click', async () => {
              button.disabled = true
              try {
                const answer = await authorized(`/admin/testimonials/${row.id}/${decision}`, { method: 'POST' })
                const result = await answer.json()
                if (!answer.ok) throw new Error(result.error || 'Review failed.')
                feedback.textContent = result.message
                await showTestimonialWorkspace(main)
                loadTestimonials()
              } catch (error) { feedback.textContent = error.message; button.disabled = false }
            })
            actions.append(button)
          }
        } else actions.textContent = row.status === 'approved' ? 'Published' : 'Not published'
        tr.append(actions)
        body.append(tr)
      })
      if (!body.children.length) { const tr = h('tr'); tr.innerHTML = '<td colspan="4">No testimonial submissions yet.</td>'; body.append(tr) }
    } catch (error) { feedback.textContent = error.message }
    nav.querySelectorAll('.testimonial-admin-link').forEach(button => button.classList.add('selected'))
  }

  function attachDashboardNavigation() {
    const nav = q('.workspace-nav')
    const main = q('.workspace-main')
    if (!nav || !main || nav.querySelector('.testimonial-admin-link')) return
    const user = JSON.parse(sessionStorage.getItem('user') || 'null')
    if (!user?.roles?.some(role => ['president', 'super_administrator'].includes(role))) return
    const button = h('button', 'testimonial-admin-link')
    button.innerHTML = '<span aria-hidden="true">❝</span> Testimonials'
    button.type = 'button'
    button.addEventListener('click', () => showTestimonialWorkspace(main))
    const profileButton = [...nav.children].find(item => /profile/i.test(item.textContent || ''))
    nav.insertBefore(button, profileButton || null)
    nav.addEventListener('click', event => {
      if (event.target.closest('.testimonial-admin-link')) return
      const panel = q('.testimonial-admin-panel', main)
      if (panel) { panel.hidden = true; [...main.children].forEach(child => { child.hidden = false }) }
    })
  }

  let attempts = 0
  removePublicTestimonialForm()
  ensureBackToTop()
  const timer = setInterval(() => {
    reorderLanding()
    attachDashboardNavigation()
    attempts += 1
    if ((q('main.landing') || q('.workspace-shell')) && attempts > 8) clearInterval(timer)
  }, 250)
  new MutationObserver(() => { removePublicTestimonialForm(); reorderLanding(); attachDashboardNavigation() }).observe(document.getElementById('root') || document.body, { childList: true, subtree: true })

})()
