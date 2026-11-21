import { useEffect, useMemo, useState } from 'react'
import { Mail, Lock, LoaderCircle, ArrowRight, CalendarDays, UsersRound, Music, Menu, X, Image as ImageIcon, Video, Cake, Search, Crown, Mic2 } from 'lucide-react'
import api from './services/api'

const galleryPhotos = [
  { src: '/gallery/sports1.jpeg', alt: 'Choir members gathered for a group sports photo', title: 'A day together', detail: 'Choir fellowship' },
  { src: '/gallery/sport2.jpeg', alt: 'Choir members posing together on the field', title: 'Team spirit', detail: 'Sports day' },
  { src: '/gallery/sport4.jpeg', alt: 'Choir members enjoying a game outdoors', title: 'Joy in community', detail: 'Sports day' },
  { src: '/gallery/cbb-kibeho.jpeg', alt: 'Chorale Le Bon Berger gathered outside a church in Kibeho', title: 'A day in Kibeho', detail: 'Choir gathering' },
  { src: '/gallery/cbb-yose-nziza.jpeg', alt: 'Choir members singing together outdoors', title: 'Singing together', detail: 'Choir fellowship' },
  { src: '/gallery/cute-concert.jpeg', alt: 'Chorale Le Bon Berger performing at a concert', title: 'A night of song', detail: 'Choir concert' },
  { src: '/gallery/cute-more.jpeg', alt: 'The choir performing on stage with its musicians', title: 'On stage together', detail: 'Choir concert' },
]

const voiceParts = ['All voices', 'Soprano', 'Alto', 'Tenor', 'Bass']

function nextBirthday(member) {
  if (!member.birthday) return null
  const [month, day] = member.birthday.split('-').map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let date = new Date(today.getFullYear(), month - 1, day)
  if (date < today) date = new Date(today.getFullYear() + 1, month - 1, day)
  return date
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function imageUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const baseUrl = api.defaults.baseURL || window.location.origin
  return new URL(path, `${baseUrl.replace(/\/$/, '')}/`).toString()
}

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(sessionStorage.getItem('user')) } catch { return null } })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [members, setMembers] = useState([])
  const [leadership, setLeadership] = useState([])
  const [directoryLoading, setDirectoryLoading] = useState(true)
  const [directoryError, setDirectoryError] = useState('')
  const [voiceFilter, setVoiceFilter] = useState('All voices')
  const [memberSearch, setMemberSearch] = useState('')
  const [photoUploadBusy, setPhotoUploadBusy] = useState(false)
  const [photoUploadMessage, setPhotoUploadMessage] = useState('')
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [heroPaused, setHeroPaused] = useState(false)
  const [activeDialog, setActiveDialog] = useState(null)
  const [dialogBusy, setDialogBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [dialogSuccess, setDialogSuccess] = useState('')
  const [applications, setApplications] = useState([])
  const [adminMessage, setAdminMessage] = useState('')
  const [workspacePage, setWorkspacePage] = useState('overview')
  const [reviewingApplication, setReviewingApplication] = useState(null)
  const [managedMembers, setManagedMembers] = useState([])
  const [pledges, setPledges] = useState([])
  const [presidentDataError, setPresidentDataError] = useState('')
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null)
  const [showCreateMember, setShowCreateMember] = useState(false)
  const [creatingMember, setCreatingMember] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [leadershipSaving,setLeadershipSaving]=useState(false)
  const canLead = user?.roles?.some((role) => ['president', 'super_administrator'].includes(role))
  const canAccount = user?.roles?.includes('accountant') || user?.roles?.includes('treasurer')
  useEffect(() => {
    if (user && canLead && workspacePage === 'overview') api.get('/admin/dashboard').then(({data})=>setDashboardAnalytics(data.analytics)).catch(()=>setPresidentDataError('Could not load dashboard analytics.'))
  }, [user, canLead, workspacePage])
  useEffect(() => {
    if (!user || !canLead) return
    api.get('/admin/applications').then(({data}) => setApplications(data.applications || [])).catch((e) => setAdminMessage(e.response?.data?.error || 'Could not load member applications.'))
  }, [user, canLead])
  useEffect(() => {
    if (!user || !canLead) return
    if (workspacePage === 'members') api.get('/admin/members').then(({data})=>setManagedMembers(data.members||[])).catch(e=>setPresidentDataError(e.response?.data?.error||'Could not load members.'))
    if (workspacePage === 'donations') api.get('/admin/donations').then(({data})=>setPledges(data.donations||[])).catch(e=>setPresidentDataError(e.response?.data?.error||'Could not load donation pledges.'))
  }, [user, canLead, workspacePage])
  async function reviewApplication(id, decision) {
    setAdminMessage('')
    setReviewingApplication(id)
    try {
      await api.post(`/admin/applications/${id}/${decision}`)
      setApplications((rows) => rows.map((row) => row.id === id ? {...row, status: decision === 'approve' ? 'approved' : 'rejected'} : row))
      setAdminMessage(`Application ${decision === 'approve' ? 'approved' : 'rejected'}.`)
    } catch (e) { setAdminMessage(e.response?.data?.error || 'Could not review this application.') }
    finally { setReviewingApplication(null) }
  }
  async function editManagedMember(member) {
    setEditingMember(member)
  }
  async function saveManagedMember(e){e.preventDefault();const form=new FormData(e.currentTarget);const payload=Object.fromEntries(form.entries());payload.roles=[payload.role];delete payload.role;payload.is_active=payload.is_active==='true';try{const {data}=await api.patch(`/admin/members/${editingMember.id}`,payload);setManagedMembers(rows=>rows.map(row=>row.id===editingMember.id?{...row,...data.member}:row));setEditingMember(null);setPresidentDataError('Member account updated.')}catch(err){setPresidentDataError(err.response?.data?.error||'Could not update member.')}}
  async function createManagedMember(e) {
    e.preventDefault();setPresidentDataError('');setCreatingMember(true)
    const form=new FormData(e.currentTarget);const payload=Object.fromEntries(form.entries())
    try { const {data}=await api.post('/admin/members',payload);setManagedMembers(rows=>[...rows,data.member].sort((a,b)=>a.fullnames.localeCompare(b.fullnames)));e.currentTarget.reset();setShowCreateMember(false);setPresidentDataError('Member account created.') }
    catch(err){setPresidentDataError(err.response?.data?.error||'Could not create member account.')}
    finally{setCreatingMember(false)}
  }
  async function createLeadershipTerm(e){e.preventDefault();setLeadershipSaving(true);setPresidentDataError('');const payload=Object.fromEntries(new FormData(e.currentTarget).entries());try{const {data}=await api.post('/admin/leadership',payload);setLeadership(rows=>[...rows,data.leadership].sort((a,b)=>a.start_date.localeCompare(b.start_date)));e.currentTarget.reset();setPresidentDataError('Leadership record added to the public history.')}catch(err){setPresidentDataError(err.response?.data?.error||'Could not save leadership record.')}finally{setLeadershipSaving(false)}}
  async function archiveManagedMember(member) {
    if(!window.confirm(`Archive ${member.fullnames}? Their records will be retained.`))return
    try { await api.delete(`/admin/members/${member.id}`); setManagedMembers(rows=>rows.map(row=>row.id===member.id?{...row,is_active:false}:row)); setPresidentDataError('Member archived; history retained.') }
    catch(e){setPresidentDataError(e.response?.data?.error||'Could not archive member.')}
  }
  useEffect(() => {
    if (heroPaused) return undefined
    const timer = window.setInterval(() => setActiveHeroSlide((current) => (current + 1) % galleryPhotos.length), 5500)
    return () => window.clearInterval(timer)
  }, [heroPaused])
  useEffect(() => {
    if (!activeDialog) return undefined
    function onKeyDown(event) { if (event.key === 'Escape') setActiveDialog(null) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeDialog])
  useEffect(() => {
    let current = true
    api.get('/members')
      .then(({data}) => { if (current) { setMembers(data.members || []); setDirectoryError('') } })
      .catch(() => { if (current) setDirectoryError('The choir directory could not connect to the database. Please try again later.') })
      .finally(() => { if (current) setDirectoryLoading(false) })
    api.get('/leadership')
      .then(({data}) => { if (current) setLeadership(data.leadership || []) })
      .catch(() => { if (current) setLeadership([]) })
    return () => { current = false }
  }, [])
  const visibleMembers = useMemo(() => members.filter((member) => {
    const matchesVoice = voiceFilter === 'All voices' || (member.voice_part || '').toLowerCase() === voiceFilter.toLowerCase()
    const matchesName = member.name.toLowerCase().includes(memberSearch.trim().toLowerCase())
    return matchesVoice && matchesName
  }), [members, voiceFilter, memberSearch])
  const upcomingBirthdays = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return members.map((member) => ({ ...member, nextBirthday: nextBirthday(member) }))
      .filter((member) => member.nextBirthday && (member.nextBirthday - today) / 86400000 <= 30)
      .sort((a, b) => a.nextBirthday - b.nextBirthday)
  }, [members])
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      sessionStorage.setItem('access_token', data.access_token); sessionStorage.setItem('refresh_token', data.refresh_token); sessionStorage.setItem('user', JSON.stringify(data.user)); setUser(data.user)
    } catch (err) { setError(err.response?.data?.error || 'Unable to connect. Check that the API is running.') }
    finally { setBusy(false) }
  }
  async function uploadProfilePicture(e) {
    const input = e.currentTarget
    const file = input.files?.[0]
    if (!file) return
    setPhotoUploadMessage('')
    if (file.size > 5 * 1024 * 1024) {
      setPhotoUploadMessage('Choose an image smaller than 5 MB.')
      input.value = ''
      return
    }
    const form = new FormData()
    form.append('profile_picture', file)
    setPhotoUploadBusy(true)
    try {
      const { data } = await api.post('/auth/profile-picture', form)
      const updatedUser = { ...user, ...data.user }
      sessionStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setMembers((currentMembers) => currentMembers.map((member) => member.id === updatedUser.id
        ? { ...member, profile_picture: updatedUser.profile_picture }
        : member))
      setPhotoUploadMessage('Your profile picture is updated.')
    } catch (err) {
      setPhotoUploadMessage(err.response?.data?.error || 'Could not upload your picture. Please try again.')
    } finally {
      setPhotoUploadBusy(false)
      input.value = ''
    }
  }
  async function submitJoin(e) {
    e.preventDefault(); setDialogError(''); setDialogBusy(true)
    const formElement = e.currentTarget
    const form = new FormData(formElement)
    try {
      await api.post('/registrations', form)
      setDialogSuccess('Thank you for reaching out. The choir committee will follow up with you soon.')
      formElement.reset()
    } catch (err) { setDialogError(err.response?.data?.error || 'We could not send your request. Please try again later.') }
    finally { setDialogBusy(false) }
  }
  async function submitDonation(e) {
    e.preventDefault(); setDialogError(''); setDialogBusy(true)
    const formElement = e.currentTarget
    const form = new FormData(formElement)
    const payload = Object.fromEntries(form.entries())
    try {
      await api.post('/donations', payload)
      setDialogSuccess('Thank you for supporting the choir. The committee will contact you to arrange the next steps.')
      formElement.reset()
    } catch (err) { setDialogError(err.response?.data?.error || 'We could not send your message. Please try again later.') }
    finally { setDialogBusy(false) }
  }
  if (user) return <main className="workspace-shell"><aside className="workspace-sidebar"><a className="workspace-brand" href="#workspace"><img src="/gallery/cbb-logo.png" alt=""/><span>LE BON BERGER<small>CHOIR MANAGEMENT</small></span></a><div className="sidebar-user"><img src={imageUrl(user.profile_picture) || '/gallery/cbb-logo.png'} alt=""/><span><b>{user.fullnames || 'Choir user'}</b><small>{user.roles.join(', ')}</small></span></div><nav className="workspace-nav" aria-label="Workspace navigation"><button className={workspacePage==='overview'?'selected':''} onClick={()=>setWorkspacePage('overview')}><span>⌂</span>Dashboard</button>{canLead && <><button className={workspacePage==='members'?'selected':''} onClick={()=>setWorkspacePage('members')}><span>♙</span>Members</button><button className={workspacePage==='applications'?'selected':''} onClick={()=>setWorkspacePage('applications')}><span>✓</span>Applications <i>{applications.filter(a=>a.status==='pending').length}</i></button><button className={workspacePage==='donations'?'selected':''} onClick={()=>setWorkspacePage('donations')}><span>♥</span>Donations</button><button className={workspacePage==='leadership'?'selected':''} onClick={()=>setWorkspacePage('leadership')}><span>♛</span>Leadership</button><button className={workspacePage==='families'?'selected':''} onClick={()=>setWorkspacePage('families')}><span>♧</span>Families</button><button className={workspacePage==='events'?'selected':''} onClick={()=>setWorkspacePage('events')}><span>▦</span>Events</button><button className={workspacePage==='songs'?'selected':''} onClick={()=>setWorkspacePage('songs')}><span>♫</span>Songs</button><button className={workspacePage==='gallery'?'selected':''} onClick={()=>setWorkspacePage('gallery')}><span>▧</span>Gallery</button></>}{canAccount && <button className={workspacePage==='finance'?'selected':''} onClick={()=>setWorkspacePage('finance')}><span>₣</span>Finance</button>}<button className={workspacePage==='profile'?'selected':''} onClick={()=>setWorkspacePage('profile')}><span>◉</span>My profile</button></nav><button className="workspace-signout" onClick={() => { sessionStorage.clear(); setUser(null) }}>↪ Sign out</button></aside><section className="workspace-main"><header className="workspace-topbar"><div><span>CHORALE LE BON BERGER</span><h1>{workspacePage==='overview'?'Overview':workspacePage==='applications'?'Membership applications':workspacePage==='finance'?'Finance':'My profile'}</h1></div><span className="workspace-role">{user.roles.join(' · ')}</span></header>{workspacePage==='overview' && <><section className="workspace-welcome"><img className="workspace-avatar" src={imageUrl(user.profile_picture) || '/gallery/cbb-logo.png'} alt={user.profile_picture ? `Profile photo of ${user.fullnames || user.email}` : 'Profile photo placeholder'}/><div><span className="workspace-kicker">WELCOME BACK</span><h2>{user.fullnames || user.email}</h2><p>Your choir workspace is ready.</p></div></section>{dashboardAnalytics && <section className="analytics-grid" aria-label="Choir analytics"><article><span>Active members</span><b>{dashboardAnalytics.active_members}</b></article><article><span>Honorary members</span><b>{dashboardAnalytics.honorary_members}</b></article><article><span>Pending applications</span><b>{dashboardAnalytics.pending_applications}</b></article><article><span>Donation pledges to review</span><b>{dashboardAnalytics.pending_donation_pledges}</b></article><article className="voice-analytics"><span>Members by voice part</span>{Object.entries(dashboardAnalytics.members_by_voice).map(([voice,count])=><div key={voice}><small>{voice}</small><i><em style={{width:`${Math.max(5,count/Math.max(dashboardAnalytics.active_members,1)*100)}%`}}/></i><b>{count}</b></div>)}</article></section>}<div className="workspace-tiles">{canLead && <button onClick={()=>setWorkspacePage('applications')}><b>{applications.filter(a=>a.status==='pending').length}</b><span>Pending applications</span><small>Review member requests →</small></button>}{canAccount && <button onClick={()=>setWorkspacePage('finance')}><b>Finance</b><span>Donations and contributions</span><small>Open finance workspace →</small></button>}</div></>}{workspacePage==='applications' && canLead && <section className="role-panel"><div className="eyebrow"><span/> PRESIDENT DASHBOARD</div><h2>Review new member requests</h2><p>Approve a request to add the applicant to the member directory.</p>{adminMessage && <p className="admin-feedback" role="status">{adminMessage}</p>}{applications.length ? applications.map((app) => <article className="application-row" key={app.id}><div><b>{app.fullnames}</b><span>{app.email} · {app.telephone} · {app.voiceprefer}</span><small>{app.talent || 'No additional interests provided'} · {app.status}</small></div>{app.status === 'pending' && <div><button disabled={reviewingApplication===app.id} onClick={() => reviewApplication(app.id, 'approve')}>{reviewingApplication===app.id?'Saving…':'Approve'}</button><button disabled={reviewingApplication===app.id} className="reject-button" onClick={() => reviewApplication(app.id, 'reject')}>Reject</button></div>}</article>) : <p>No applications to review.</p>}</section>}{workspacePage==='members' && canLead && <section className="role-panel"><div className="eyebrow"><span/> CHOIR DIRECTORY</div><div className="member-management-heading"><h2>Manage members</h2><button onClick={()=>setShowCreateMember(!showCreateMember)}>{showCreateMember?"Cancel":"+ Create member"}</button></div>{showCreateMember && <form className="create-member-form" onSubmit={createManagedMember}><label>Full name<input name="fullnames" maxLength="160" required/></label><label>Email<input name="email" type="email" maxLength="254" required/></label><label>Telephone<input name="telephone" maxLength="32"/></label><label>Voice part<select name="voiceprefer" required defaultValue=""><option value="" disabled>Select voice part</option><option value="soprano">Soprano</option><option value="alto">Alto</option><option value="tenor">Tenor</option><option value="bass">Bass</option></select></label><button disabled={creatingMember}>{creatingMember?"Creating…":"Create account"}</button></form>}{presidentDataError && <p role="status">{presidentDataError}</p>}{managedMembers.length ? managedMembers.map(m=><article className="application-row" key={m.id}><div className="managed-person"><img src={imageUrl(m.profile_picture)||'/gallery/cbb-logo.png'} alt=""/><div><b>{m.fullnames||m.email}</b><span>{m.email} · {m.voiceprefer||'Voice not set'} · {m.membership_status} · Role: {(m.roles||[]).join(', ')||'member'}</span><small>{m.is_active?'Active account':'Archived account'}</small></div></div><div><button onClick={()=>editManagedMember(m)}>Edit</button>{m.is_active?<button className="reject-button" onClick={()=>archiveManagedMember(m)}>Archive</button>:<button onClick={async()=>{try{await api.patch(`/admin/members/${m.id}`,{is_active:true});setManagedMembers(rows=>rows.map(row=>row.id===m.id?{...row,is_active:true}:row));setPresidentDataError("Member restored.")}catch(e){setPresidentDataError(e.response?.data?.error||"Could not restore member.")}}}>Restore</button>}</div></article>):<p>No member accounts found.</p>}{editingMember && <div className="member-edit-backdrop"><form className="member-edit-card" onSubmit={saveManagedMember}><button type="button" className="edit-close" onClick={()=>setEditingMember(null)}>×</button><div className="eyebrow"><span/> MEMBER ADMINISTRATION</div><h3>Edit member account</h3><label>Full name<input name="fullnames" required maxLength="160" defaultValue={editingMember.fullnames}/></label><label>Email address<input value={editingMember.email} disabled/></label><label>Telephone<input name="telephone" maxLength="32" defaultValue={editingMember.telephone||''}/></label><label>Voice part<select name="voiceprefer" defaultValue={editingMember.voiceprefer||'bass'}><option value="soprano">Soprano</option><option value="alto">Alto</option><option value="tenor">Tenor</option><option value="bass">Bass</option></select></label><label>Choir role<select name="role" defaultValue={editingMember.roles?.[0]||'member'}><option value="member">Member</option><option value="president">President</option><option value="accountant">Accountant</option><option value="treasurer">Treasurer</option><option value="vice_president">Vice president</option><option value="secretary">Secretary</option><option value="conductor">Conductor</option><option value="section_leader">Section leader</option><option value="super_administrator">Super administrator</option></select></label><label>Membership status<select name="membership_status" defaultValue={editingMember.membership_status||'active'}><option value="active">Active</option><option value="honorary">Honorary</option></select></label><label>Account access<select name="is_active" defaultValue={String(editingMember.is_active)}><option value="true">Enabled</option><option value="false">Archived</option></select></label><div className="edit-actions"><button type="button" className="reject-button" onClick={()=>setEditingMember(null)}>Cancel</button><button type="submit">Save changes</button></div></form></div>}</section>}{workspacePage==='leadership' && canLead && <section className="role-panel"><div className="eyebrow"><span/> CHOIR COMMITTEE HISTORY</div><h2>Leadership and committees</h2><p>Add current or previous committee service. Entries appear in the public Leadership section.</p><form className="create-member-form leadership-form" onSubmit={createLeadershipTerm}><label>Person name<input name="person_name" maxLength="160" required/></label><label>Role performed<input name="position" maxLength="100" placeholder="President, Treasurer…" required/></label><label>Committee name<input name="committee" maxLength="160" placeholder="Executive committee"/></label><label>Service status<select name="status" defaultValue="active"><option value="active">Active</option><option value="honorary">Honorary</option></select></label><label>Start date<input name="start_date" type="date" required/></label><label>End date<input name="end_date" type="date"/></label><button disabled={leadershipSaving}>{leadershipSaving?'Saving…':'Add leadership record'}</button></form>{presidentDataError && <p role="status">{presidentDataError}</p>}<div className="leadership-list">{leadership.map(term=><article className="leadership-card" key={term.id}><div className="leadership-marker"><Crown size={17}/></div><div className="leadership-copy"><div className="leadership-title-row"><h3>{term.name}</h3><span className="current-term">{term.status==='honorary'?'Honorary':term.end_date?'Past':'Current'}</span></div><p>{term.position}{term.committee?` · ${term.committee}`:''}</p><small>{term.start_date} — {term.end_date||'Present'}</small></div></article>)}</div></section>}{workspacePage==='donations' && canLead && <section className="role-panel"><div className="eyebrow"><span/> DONATIONS</div><h2>Donation pledges</h2><p>Pledges are not confirmed payments. Record received funds separately in the finance ledger.</p>{presidentDataError && <p role="status">{presidentDataError}</p>}{pledges.length?pledges.map(d=><article className="application-row" key={d.id}><div><b>{d.donor_name}</b><span>{d.email} · {d.amount_description||'Amount not stated'}</span><small>{d.message||'No message'} · {d.status}</small></div>{d.status==='pending'&&<button onClick={async()=>{try{await api.patch(`/admin/donations/${d.id}/review`);setPledges(rows=>rows.map(row=>row.id===d.id?{...row,status:'reviewed'}:row));setPresidentDataError('Pledge marked reviewed; no payment recorded.')}catch(e){setPresidentDataError(e.response?.data?.error||'Could not update pledge.')}}}>Mark reviewed</button>}</article>):<p>No donation pledges recorded.</p>}</section>}{['families','events','songs','gallery'].includes(workspacePage) && canLead && <section className="role-panel"><div className="eyebrow"><span/> PRESIDENT WORKSPACE</div><h2>{workspacePage[0].toUpperCase()+workspacePage.slice(1)}</h2><p>This menu is ready. Its management tools will be enabled when the matching database records and API are connected.</p></section>}{workspacePage==='finance' && canAccount && <section className="role-panel"><div className="eyebrow"><span/> ACCOUNTANT WORKSPACE</div><h2>Finance</h2><p>Donations, member subscriptions and event contributions.</p><p>Finance records require the transactions module to be connected before entries can be recorded.</p></section>}{workspacePage==='profile' && <><section className="workspace-welcome"><img className="workspace-avatar" src={imageUrl(user.profile_picture) || '/gallery/cbb-logo.png'} alt={user.profile_picture ? `Profile photo of ${user.fullnames || user.email}` : 'Profile photo placeholder'}/><div><span className="workspace-kicker">{user.roles.join(', ').toUpperCase()}</span><h2>{user.fullnames || user.email}</h2><p>{user.email}</p></div></section><form className="profile-picture-form"><label htmlFor="profile-picture-upload">Update your profile photo</label><input id="profile-picture-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadProfilePicture} disabled={photoUploadBusy}/><span>JPG, PNG, or WebP up to 5 MB. Your photo appears on your account and member card.</span>{photoUploadBusy && <span>Uploading…</span>}{photoUploadMessage && <span role="status">{photoUploadMessage}</span>}</form></>}</section></main>
  return <main className="landing">
    <nav className="nav"><a className="identity" href="#home" aria-label="Chorale Le Bon Berger home"><img className="identity-logo" src="/gallery/cbb-logo.png" alt=""/><span>CHORALE <b>LE BON BERGER</b></span></a><div className={`nav-links ${menuOpen?'open':''}`}><a href="#home" onClick={()=>setMenuOpen(false)}>Home</a><a href="#about" onClick={()=>setMenuOpen(false)}>About</a><a href="#members" onClick={()=>setMenuOpen(false)}>Members</a><a href="#announcements" onClick={()=>setMenuOpen(false)}>Announcement</a><a href="#events" onClick={()=>setMenuOpen(false)}>Events</a><a href="#gallery" onClick={()=>setMenuOpen(false)}>Gallery</a><a href="#songs" onClick={()=>setMenuOpen(false)}>Songs in PDF</a><a className="nav-login" href="#signin" onClick={()=>setMenuOpen(false)}>Sign in <ArrowRight size={15}/></a></div><button className="menu" aria-label={menuOpen?'Close navigation':'Open navigation'} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button></nav>
    <section id="home" className="hero hero-fullscreen" onMouseEnter={() => setHeroPaused(true)} onMouseLeave={() => setHeroPaused(false)} onFocus={() => setHeroPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHeroPaused(false) }}><div className="home-backdrop" aria-label="Choir photo slideshow" aria-live="polite">{galleryPhotos.map((photo, index) => <img key={photo.src} className={index === activeHeroSlide ? 'home-slide active' : 'home-slide'} src={photo.src} alt={photo.alt} aria-hidden={index !== activeHeroSlide}/>)}</div><div className="home-overlay"/><div className="hero-copy home-welcome"><div className="eyebrow"><span/> CHORALE LE BON BERGER</div><h1>Welcome to<br/><i>the family.</i></h1><p className="hero-intro">Faith in every heart. Song in every voice.</p><div className="home-actions"><button type="button" className="home-action join-action" onClick={() => { setActiveDialog('join'); setDialogError(''); setDialogSuccess('') }}>Join the choir <ArrowRight size={17}/></button><button type="button" className="home-action donate-action" onClick={() => { setActiveDialog('donate'); setDialogError(''); setDialogSuccess('') }}>Make a donation</button></div></div><div className="home-slide-controls" role="group" aria-label="Choose a home page photo">{galleryPhotos.map((photo, index) => <button key={photo.src} type="button" className={index === activeHeroSlide ? 'hero-dot active' : 'hero-dot'} aria-label={`Show photo ${index + 1}: ${photo.title}`} aria-pressed={index === activeHeroSlide} onClick={() => setActiveHeroSlide(index)}/>)}</div><div className="hero-index">{String(activeHeroSlide + 1).padStart(2, '0')} <span>/</span> {String(galleryPhotos.length).padStart(2, '0')}</div></section>
    <section id="about" className="pillars"><div className="pillar"><span className="pillar-icon"><UsersRound size={20}/></span><div><b>A family in harmony</b><small>People connected by purpose.</small></div></div><div className="pillar" id="events"><span className="pillar-icon"><CalendarDays size={20}/></span><div><b>Life in the choir</b><small>Gatherings, services and events.</small></div></div><div className="pillar" id="songs"><span className="pillar-icon"><Music size={20}/></span><div><b>Our shared songbook</b><small>Music to sing and share together.</small></div></div></section>
    <section id="president" className="president-section"><article className="president-profile"><img src={imageUrl('media/profile/president-sylvestre.jpeg')} alt="Portrait of Sylvestre TURAMYENYIRIJURU, current choir president" loading="lazy"/><div className="president-copy"><div className="eyebrow"><span/> CURRENT PRESIDENT</div><h2>Sylvestre TURAMYENYIRIJURU</h2><p>President of Chorale Le Bon Berger</p></div></article><article className="president-speech"><div className="speech-topline"><span><Mic2 size={16}/> PRESIDENT’S MESSAGE</span><b>COMING SOON</b></div><h3>An upcoming speech from our president</h3><p>Mr. Manzi Pacifique’s next message will be shared here soon.</p></article></section>
    <section id="members" className="members-section">
      <header className="community-heading"><div><div className="eyebrow"><span/> OUR CHOIR FAMILY</div><h2>Meet the members</h2><p>Find every voice in our choir, from soprano to bass.</p></div><div className="member-count"><UsersRound size={19}/><span><b>{members.length}</b><small>members</small></span></div></header>
      <div className="directory-toolbar"><div className="voice-filters" role="group" aria-label="Filter members by voice part">{voiceParts.map((part) => <button type="button" key={part} className={voiceFilter === part ? 'voice-filter active' : 'voice-filter'} onClick={() => setVoiceFilter(part)}>{part}</button>)}</div><label className="member-search"><Search size={17}/><input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search a name" aria-label="Search members by name"/></label></div>
      {directoryError && <p className="directory-message" role="alert">{directoryError}</p>}
      {directoryLoading ? <div className="directory-empty"><LoaderCircle className="spin" size={22}/><span>Loading the choir directory…</span></div> : !directoryError && visibleMembers.length === 0 ? <div className="directory-empty"><Mic2 size={25}/><b>{members.length ? 'No voices match that search.' : 'Your choir directory is ready.'}</b><span>{members.length ? 'Try another name or voice part.' : 'Member profiles will appear here when names and voice parts are added to user accounts.'}</span></div> : <div className="member-grid">{visibleMembers.map((member) => <article className="member-card" key={member.id}><div className="member-card-top">{member.profile_picture ? <img className="member-photo" src={imageUrl(member.profile_picture)} alt={`Photo of ${member.name}`} loading="lazy"/> : <div className="member-photo-placeholder"><span className="member-avatar">{initials(member.name)}</span><span className="photo-placeholder-label">Profile photo</span></div>}<span className={`member-status ${member.status}`}>{member.status === 'honorary' ? 'Honorary' : 'Active'}</span></div><h3>{member.name}</h3><div className="member-voice"><Music size={15}/>{member.voice_part}</div></article>)}</div>}
    </section>
    <section id="leadership" className="history-section"><header className="community-heading"><div><div className="eyebrow"><span/> LEADING IN SERVICE</div><h2>Choir leadership</h2><p>Honouring the people and committees who have guided the choir through the years.</p></div><div className="history-emblem"><Crown size={21}/></div></header><div className="leadership-list">{leadership.length ? leadership.map((term) => <article className="leadership-card" key={term.id}><div className="leadership-marker"><Crown size={17}/></div><div className="leadership-copy"><div className="leadership-title-row"><h3>{term.name}</h3><span className="current-term">{term.status==='honorary'?'Honorary':term.end_date?'Past':'Current'}</span></div><p>{term.position}{term.committee ? ` · ${term.committee}` : ''}</p><small>{term.start_date} — {term.end_date || 'Present'}</small></div></article>) : <div className="directory-empty leadership-empty"><Crown size={24}/><b>Leadership history</b><span>Past leaders, committee names, and their service periods will appear here when added to the database.</span></div>}</div></section>
    <section className="birthday-section"><div className="birthday-panel"><div className="birthday-heading"><div className="birthday-icon"><Cake size={21}/></div><div><div className="eyebrow"><span/> CELEBRATE OUR PEOPLE</div><h2>Upcoming birthdays</h2><p>Send a little joy to a choir member this month.</p></div></div>{upcomingBirthdays.length ? <div className="birthday-list">{upcomingBirthdays.map((member) => <article className="birthday-card" key={member.id}><div className="birthday-date"><b>{member.nextBirthday.toLocaleDateString(undefined, { day: '2-digit' })}</b><small>{member.nextBirthday.toLocaleDateString(undefined, { month: 'short' })}</small></div><div><h3>{member.name}</h3><p>{member.voice_part}</p></div><Cake className="birthday-mini" size={18}/></article>)}</div> : <div className="birthday-empty"><Cake size={22}/><span>Birthday wishes will appear here for the next 30 days.</span></div>}</div></section>
    <section id="gallery" className="gallery"><header className="gallery-head"><div><div className="eyebrow"><span/> MOMENTS IN HARMONY</div><h2>Our gallery</h2><p>Choir life, worship and fellowship—captured together.</p></div><div className="gallery-label"><ImageIcon size={15}/> PHOTOS <span>·</span> <Video size={15}/> VIDEO</div></header><div className="gallery-grid">{galleryPhotos.map((photo) => <article className="gallery-card photo-card" key={photo.src}><img className="gallery-image" src={photo.src} alt={photo.alt} loading="lazy"/><div className="gallery-caption"><span>{photo.title}</span><small>{photo.detail}</small></div></article>)}<article className="gallery-card video-card"><video className="gallery-video" controls preload="metadata" playsInline aria-label="We Are Not Alone choir video"><source src="/gallery/we-are-not-alone.mp4" type="video/mp4"/>Your browser does not support video playback.</video><div className="gallery-caption"><span>We Are Not Alone</span><small>Choir video</small></div></article></div></section>
    <section id="announcements" className="signin"><div className="signin-copy"><div className="eyebrow">A PLACE TO BELONG</div><h2>Come sing<br/>with us.</h2><p>Members can sign in to see choir updates, activities, and shared music.</p></div><form id="signin" className="login-card" onSubmit={submit}><div className="card-heading"><div className="card-icon"><Music size={20}/></div><div><b>Member sign in</b><small>Welcome back to your choir</small></div></div>{error && <div className="error" role="alert">{error}</div>}<label>Email address<div className="input"><Mail size={17}/><input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label><label>Password<div className="input"><Lock size={17}/><input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/></div></label><button className="submit" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:null}Sign in <ArrowRight size={16}/></button><footer>Private, secure access for choir members</footer></form></section>
    <footer className="site-footer"><a className="identity" href="#home"><img className="identity-logo" src="/gallery/cbb-logo.png" alt=""/><span>CHORALE <b>LE BON BERGER</b></span></a><span>Rooted in faith. Raised in song.</span><small>© 2026 CHORALE LE BON BERGER</small></footer>
    {activeDialog && <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveDialog(null) }}><section className="contact-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title"><button className="dialog-close" type="button" aria-label="Close form" onClick={() => setActiveDialog(null)}><X size={20}/></button><div className="eyebrow"><span/> {activeDialog === 'join' ? 'FIND YOUR PLACE' : 'SUPPORT THE CHOIR'}</div><h2 id="contact-dialog-title">{activeDialog === 'join' ? 'Join the choir' : 'Make a donation'}</h2><p className="dialog-intro">{activeDialog === 'join' ? 'Tell us a little about yourself and we’ll be in touch.' : 'Share your details and the committee will contact you to arrange your support.'}</p>{dialogSuccess ? <div className="dialog-success" role="status"><span>{dialogSuccess}</span><button type="button" className="submit" onClick={() => setActiveDialog(null)}>Done</button></div> : activeDialog === 'join' ? <form className="dialog-form" onSubmit={submitJoin}><div className="dialog-form-grid"><label>Full name<input name="fullnames" required maxLength="160" autoComplete="name"/></label><label>Telephone<input name="telephone" required maxLength="32" autoComplete="tel"/></label><label>Email address<input name="email" type="email" required maxLength="254" autoComplete="email"/></label><label>Voice part<select name="voiceprefer" required defaultValue=""><option value="" disabled>Choose your voice</option><option value="alto">Alto</option><option value="bass">Bass</option><option value="soprano">Soprano</option><option value="tenor">Tenor</option></select></label></div><label>Profile photo <span className="required-note">Required · JPG, PNG or WebP · up to 5 MB</span><input name="profile_picture" type="file" accept="image/jpeg,image/png,image/webp" required/></label><label>Talent or musical interests<textarea name="talent" rows="2" maxLength="2000" placeholder="Singing, instruments, sound…"/></label><label>Choir or music experience<textarea name="experience" rows="2" maxLength="2000" placeholder="Tell us about your experience (optional)"/></label>{dialogError && <p className="dialog-error" role="alert">{dialogError}</p>}<button className="submit dialog-submit" type="submit" disabled={dialogBusy}>{dialogBusy ? <LoaderCircle className="spin" size={17}/> : null}Send registration <ArrowRight size={16}/></button></form> : <form className="dialog-form" onSubmit={submitDonation}><div className="dialog-form-grid"><label>Full name<input name="donor_name" required maxLength="160" autoComplete="name"/></label><label>Email address<input name="email" type="email" required maxLength="254" autoComplete="email"/></label></div><label>Donation amount or range (optional)<input name="amount_description" maxLength="80" placeholder="For example, 20,000 or monthly support"/></label><label>Message<textarea name="message" rows="3" maxLength="2000" placeholder="Share how you would like to support the choir"/></label><p className="donation-note">This form sends a pledge to the choir committee. It does not process a payment.</p>{dialogError && <p className="dialog-error" role="alert">{dialogError}</p>}<button className="submit dialog-submit" type="submit" disabled={dialogBusy}>{dialogBusy ? <LoaderCircle className="spin" size={17}/> : null}Send donation pledge <ArrowRight size={16}/></button></form>}</section></div>}
  </main>
}

