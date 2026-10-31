import { useState } from 'react'
import './App.css'

type Application = {
  id: number
  company: string
  position: string
  location: string
  status: 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected'
}

const initialApplications: Application[] = [
  { id: 1, company: 'Sakura Systems', position: 'Software Engineer', location: 'Tokyo, Japan', status: 'Applied' },
  { id: 2, company: 'Nippon Digital', position: 'Frontend Developer', location: 'Osaka, Japan', status: 'Interview' },
  { id: 3, company: 'Tokyo Tech Labs', position: 'Backend Developer', location: 'Tokyo, Japan', status: 'Saved' },
]

function App() {
  const [applications, setApplications] = useState(initialApplications)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [location, setLocation] = useState('Tokyo, Japan')
  const [status, setStatus] = useState<Application['status']>('Saved')
  const [search, setSearch] = useState('')

  const resetForm = () => {
    setCompany('')
    setPosition('')
    setLocation('Tokyo, Japan')
    setStatus('Saved')
    setEditingId(null)
    setShowForm(false)
  }

  const openAddForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (application: Application) => {
    setCompany(application.company)
    setPosition(application.position)
    setLocation(application.location)
    setStatus(application.status)
    setEditingId(application.id)
    setShowForm(true)
  }

  const saveApplication = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!company.trim() || !position.trim()) return

    if (editingId !== null) {
      setApplications((current) =>
        current.map((application) =>
          application.id === editingId
            ? { ...application, company: company.trim(), position: position.trim(), location: location.trim(), status }
            : application,
        ),
      )
    } else {
      const newApplication: Application = {
        id: Date.now(),
        company: company.trim(),
        position: position.trim(),
        location: location.trim(),
        status,
      }
      setApplications((current) => [newApplication, ...current])
    }

    resetForm()
  }

  const deleteApplication = (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this application?')
    if (!confirmed) return

    setApplications((current) =>
      current.filter((application) => application.id !== id),
    )
  }

  const filteredApplications = applications.filter((application) =>
    `${application.company} ${application.position} ${application.location}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  const countByStatus = (value: Application['status']) =>
    applications.filter((application) => application.status === value).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">J</div>
          <div>
            <h2>Japan Career</h2>
            <span>TRACKER</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>
        <nav>
          <a className="nav-item active" href="#dashboard">▦ Dashboard</a>
          <a className="nav-item" href="#applications">▤ Applications</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">S</div>
          <div>
            <strong>My Workspace</strong>
            <span>Personal job search</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <span>Workspace / Dashboard</span>
          <div className="topbar-right">
            <span className="status-dot" />
            Job search active
          </div>
        </header>

        <section className="page-heading">
          <div>
            <p className="eyebrow">YOUR CAREER JOURNEY</p>
            <h1>Dashboard</h1>
            <p className="subtitle">Keep track of your journey toward a career in Japan.</p>
          </div>
          <button className="primary-button" onClick={openAddForm}>
            + Add application
          </button>
        </section>

        {showForm && (
          <form className="application-form" onSubmit={saveApplication}>
            <h2>{editingId !== null ? 'Edit application' : 'New application'}</h2>
            <div className="form-grid">
              <label>
                Company
                <input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="e.g. Sony" required />
              </label>
              <label>
                Position
                <input value={position} onChange={(event) => setPosition(event.target.value)} placeholder="e.g. Software Engineer" required />
              </label>
              <label>
                Location
                <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Tokyo, Japan" />
              </label>
              <label>
                Status
                <select value={status} onChange={(event) => setStatus(event.target.value as Application['status'])}>
                  <option>Saved</option>
                  <option>Applied</option>
                  <option>Interview</option>
                  <option>Offer</option>
                  <option>Rejected</option>
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>
              <button type="submit" className="primary-button">
                {editingId !== null ? 'Save changes' : 'Save application'}
              </button>
            </div>
          </form>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-top"><span>Total applications</span><span>▤</span></div>
            <strong>{applications.length}</strong>
            <small>Companies tracked</small>
          </div>
          <div className="stat-card">
            <div className="stat-top"><span>Interviews</span><span>◉</span></div>
            <strong>{countByStatus('Interview')}</strong>
            <small>Interview opportunities</small>
          </div>
          <div className="stat-card">
            <div className="stat-top"><span>Offers</span><span>✧</span></div>
            <strong>{countByStatus('Offer')}</strong>
            <small>Potential opportunities</small>
          </div>
          <div className="stat-card">
            <div className="stat-top"><span>Applications pending</span><span>◷</span></div>
            <strong>{countByStatus('Applied')}</strong>
            <small>Awaiting a response</small>
          </div>
        </section>

        <section className="applications-section" id="applications">
          <div className="section-heading">
            <div>
              <h2>Recent applications</h2>
              <p>Your tracked opportunities in Japan.</p>
            </div>
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search applications..."
            />
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>COMPANY</th>
                  <th>POSITION</th>
                  <th>LOCATION</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => (
                  <tr key={application.id}>
                    <td className="company-cell">
                      <div className="company-avatar">{application.company.charAt(0).toUpperCase()}</div>
                      {application.company}
                    </td>
                    <td>{application.position}</td>
                    <td>{application.location}</td>
                    <td>
                      <span className={`status-badge ${application.status.toLowerCase()}`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="action-button" onClick={() => openEditForm(application)}>Edit</button>
                      <button className="action-button delete-button" onClick={() => deleteApplication(application.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredApplications.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">No applications found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer>Japan Career Tracker <span>Built to make your next move happen.</span></footer>
      </main>
    </div>
  )
}

export default App
