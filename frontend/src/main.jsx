import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import profileImage from '../../martin-adams-1062002-unsplash (1).jpg'

const menu = [
  { path: '/dashboard', label: 'Overview', icon: 'O' },
  { path: '/books', label: 'Inventory', icon: 'B' },
  { path: '/members', label: 'Members', icon: 'M' },
  { path: '/loans', label: 'Loans', icon: 'L' }
]

function App() {
  const [path, setPath] = React.useState(window.location.hash.slice(1) || '/dashboard')
  const [books, setBooks] = React.useState([])
  const [members, setMembers] = React.useState([])
  const [loans, setLoans] = React.useState([])
  const [query, setQuery] = React.useState('')
  const [notice, setNotice] = React.useState('')
  const [showBookForm, setShowBookForm] = React.useState(false)

  const loadData = React.useCallback(async () => {
    const [bookResponse, memberResponse, loanResponse] = await Promise.all([fetch('/api/books'), fetch('/api/members'), fetch('/api/loans')])
    setBooks(await bookResponse.json())
    setMembers(await memberResponse.json())
    setLoans(await loanResponse.json())
  }, [])

  React.useEffect(() => {
    const onHashChange = () => setPath(window.location.hash.slice(1) || '/dashboard')
    window.addEventListener('hashchange', onHashChange)
    loadData().catch(() => setNotice('Could not load library data. Is the backend running?'))
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [loadData])

  const navigate = (nextPath) => { window.location.hash = nextPath }
  const filteredBooks = books.filter(book => `${book.title} ${book.authors || ''} ${book.isbn || ''}`.toLowerCase().includes(query.toLowerCase()))
  const totalCopies = books.reduce((sum, book) => sum + book.copies, 0)

  async function addBook(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/books', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form.entries())) })
    if (!response.ok) { setNotice((await response.json()).error || 'Unable to add book'); return }
    event.currentTarget.reset(); setShowBookForm(false); setNotice('Book added to inventory'); loadData()
  }

  async function borrowBook(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/loans/borrow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form.entries())) })
    setNotice(response.ok ? 'Loan created successfully' : (await response.json()).error || 'Unable to create loan')
    if (response.ok) {
      event.currentTarget.reset()
      await loadData()
    }
  }

  async function registerMember(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form.entries())) })
    setNotice(response.ok ? 'Member registered successfully' : (await response.json()).error || 'Unable to register member')
    if (response.ok) { event.currentTarget.reset(); loadData() }
  }

  async function returnBook(loanId) {
    const response = await fetch('/api/loans/return', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ loanId }) })
    const result = await response.json()
    setNotice(response.ok ? `Book returned${result.fine ? ` - fine: $${result.fine.amount}` : ''}` : result.error || 'Unable to return book')
    if (response.ok) loadData()
  }

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">LS</span><span>Library<br /><b>Suite</b></span></div><div className="workspace-label">OPERATIONS</div><nav>{menu.map(item => <a key={item.path} className={path === item.path ? 'active' : ''} href={`#${item.path}`}><span className="nav-icon">{item.icon}</span>{item.label}</a>)}</nav><div className="sidebar-footer"><ProfileImage /><div><strong>Library desk</strong><small>Librarian account</small></div><span className="dots">...</span></div></aside>
    <main className="main-content"><header className="topbar"><div><p className="eyebrow">THURSDAY, SEPTEMBER 24, 2026</p><h1>{path === '/dashboard' ? 'Good morning, librarian' : menu.find(item => item.path === path)?.label || 'Library Suite'}</h1></div><div className="top-actions"><button className="icon-button" aria-label="Notifications">!</button><div className="user-chip"><ProfileImage small /><span>Library desk</span></div></div></header>{notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')}>x</button></div>}
      {path === '/dashboard' && <Dashboard books={books} members={members} totalCopies={totalCopies} navigate={navigate} />}
      {path === '/books' && <section className="page-section"><div className="section-heading"><div><p className="eyebrow">CATALOG MANAGEMENT</p><h2>Book inventory</h2></div><button className="primary" onClick={() => setShowBookForm(!showBookForm)}>+ Add book</button></div>{showBookForm && <form className="form-panel" onSubmit={addBook}><input name="title" placeholder="Book title" required /><input name="authors" placeholder="Author(s)" /><input name="isbn" placeholder="ISBN" /><input name="copies" type="number" min="1" defaultValue="1" /><button className="primary">Save book</button></form>}<div className="toolbar"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search title, author or ISBN" /><span>{filteredBooks.length} titles</span></div><BookTable books={filteredBooks} /></section>}
      {path === '/members' && <section className="page-section"><div className="section-heading"><div><p className="eyebrow">PEOPLE DIRECTORY</p><h2>Member records</h2></div><div className="section-actions"><span className="soft-badge">{members.length} registered</span><button className="text-button" onClick={() => loadData()}>Refresh</button></div></div><form className="form-panel member-form" onSubmit={registerMember}><input name="name" placeholder="Full name" required /><input name="email" type="email" placeholder="Email address" required /><input name="password" type="password" placeholder="Temporary password" required /><button className="primary">Add member</button></form><MemberTable members={members} /></section>}
      {path === '/loans' && <section className="page-section"><div className="section-heading"><div><p className="eyebrow">CIRCULATION DESK</p><h2>Borrowing and returns</h2></div></div><form className="form-panel loan-form" onSubmit={borrowBook}><select name="userId" required defaultValue=""><option value="" disabled>Select member</option>{members.map(member => <option key={member.id} value={member.id}>{member.name} ({member.email})</option>)}</select><select name="bookId" required defaultValue=""><option value="" disabled>Select available book</option>{books.filter(book => book.copies > 0).map(book => <option key={book.id} value={book.id}>{book.title} ({book.copies} available)</option>)}</select><input name="days" type="number" min="1" defaultValue="14" /><button className="primary">Record loan</button></form><LoanTable loans={loans} onReturn={returnBook} /></section>}
    </main>
  </div>
}

function Dashboard({ books, members, totalCopies, navigate }) { return <section className="page-section"><div className="welcome-band"><div><p className="eyebrow">TODAY AT A GLANCE</p><h2>Keep the shelves moving.</h2><p>Track your catalog, members, and circulation from one calm workspace.</p></div><button className="secondary" onClick={() => navigate('/books')}>View inventory <span>-&gt;</span></button></div><div className="stats-grid"><Stat label="Catalog titles" value={books.length} detail="Across your collection" tone="blue" /><Stat label="Available copies" value={totalCopies} detail="Ready to borrow" tone="green" /><Stat label="Active members" value={members.length} detail="Registered accounts" tone="gold" /><Stat label="Needs attention" value="0" detail="Overdue loans" tone="rose" /></div><div className="dashboard-grid"><div className="panel"><div className="panel-heading"><div><p className="eyebrow">RECENT CATALOG</p><h3>Latest additions</h3></div><button className="text-button" onClick={() => navigate('/books')}>See all -&gt;</button></div><BookTable books={books.slice(-4).reverse()} compact /></div><div className="panel accent-panel"><span className="panel-kicker">QUICK ACTION</span><h3>Ready to check out a book?</h3><p>Record a new loan in seconds and keep every return traceable.</p><button className="primary" onClick={() => navigate('/loans')}>Open circulation desk</button></div></div></section> }
function Stat({ label, value, detail, tone }) { return <div className={`stat-card ${tone}`}><span className="stat-mark">+</span><p>{label}</p><strong>{value}</strong><small>{detail}</small></div> }
function ProfileImage({ small = false }) {
  const [imageAvailable, setImageAvailable] = React.useState(true)
  return imageAvailable
    ? <img className={`avatar profile-image ${small ? 'small' : ''}`} src={profileImage} alt="Library profile" onError={() => setImageAvailable(false)} />
    : <span className={`avatar profile-fallback ${small ? 'small' : ''}`} aria-label="Library profile">LS</span>
}
function BookTable({ books, compact }) { return <div className={`table-wrap ${compact ? 'compact' : ''}`}>{books.length ? <table><thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Copies</th><th>Status</th></tr></thead><tbody>{books.map(book => <tr key={book.id}><td><strong>{book.title}</strong></td><td>{book.authors || 'Unknown author'}</td><td>{book.isbn || '-'}</td><td>{book.copies}</td><td><span className={`status ${book.copies ? 'available' : 'unavailable'}`}>{book.copies ? 'Available' : 'Checked out'}</span></td></tr>)}</tbody></table> : <div className="empty-state"><h3>No books found</h3><p>Add a title or adjust your search.</p></div>}</div> }
function MemberTable({ members }) { return <div className="table-wrap">{members.length ? <table><thead><tr><th>Member</th><th>Email</th><th>Joined</th><th>Loans</th><th>Status</th></tr></thead><tbody>{members.map(member => <tr key={member.id}><td><strong>{member.name}</strong></td><td>{member.email}</td><td>{new Date(member.createdAt).toLocaleDateString()}</td><td>{member._count.loans}</td><td><span className="status available">Active</span></td></tr>)}</tbody></table> : <div className="empty-state"><span className="empty-icon">M</span><h3>No members yet</h3><p>Registered member accounts will appear here.</p></div>}</div> }
function LoanTable({ loans, onReturn }) { return <div className="table-wrap">{loans.length ? <table><thead><tr><th>Book</th><th>Member</th><th>Due</th><th>Status</th><th>Action</th></tr></thead><tbody>{loans.map(loan => <tr key={loan.id}><td><strong>{loan.book.title}</strong></td><td>{loan.user.name}</td><td>{new Date(loan.dueAt).toLocaleDateString()}</td><td><span className={`status ${loan.returnedAt ? 'available' : 'unavailable'}`}>{loan.returnedAt ? 'Returned' : 'Borrowed'}</span></td><td>{loan.returnedAt ? (loan.fine ? `$${loan.fine.amount} fine` : '-') : <button className="text-button" onClick={() => onReturn(loan.id)}>Return book</button>}</td></tr>)}</tbody></table> : <div className="empty-state"><span className="empty-icon">L</span><h3>No loans recorded</h3><p>Borrowing activity will appear here.</p></div>}</div> }

createRoot(document.getElementById('root')).render(<App />)
