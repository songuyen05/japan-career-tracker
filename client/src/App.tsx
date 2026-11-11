import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import Login from './Login'
import { apiRequest } from './api'
import KanbanBoard from './KanbanBoard'
import AnalyticsDashboard from './AnalyticsDashboard'

type Application = {
  id: string
  company: string
  position: string
  location: string | null
  status: 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected'
  salary_min: number | string | null
  salary_max: number | string | null
  salary_currency: string
  job_url: string | null
  deadline: string | null
  applied_at: string | null
  notes: string | null
}

function formatSalaryRange(application: Application): string {
  const { salary_min, salary_max, salary_currency } = application

  if (salary_min === null && salary_max === null) {
    return '—'
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: salary_currency || 'JPY',
    maximumFractionDigits: 0,
  })

  const minimum =
    salary_min !== null ? formatter.format(Number(salary_min)) : null

  const maximum =
    salary_max !== null ? formatter.format(Number(salary_max)) : null

  if (minimum && maximum) {
    return `${minimum} – ${maximum}`
  }

  return minimum || maximum || '—'
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return '—'

  const [year, month, day] = deadline.slice(0, 10).split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDeadlineStatus(deadline: string | null): string {
  if (!deadline) return ''

  const [year, month, day] = deadline.slice(0, 10).split('-').map(Number)
  const dueDate = new Date(year, month - 1, day)
  const today = new Date()

  today.setHours(0, 0, 0, 0)

  const daysRemaining = Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysRemaining < 0) return 'overdue'
  if (daysRemaining <= 7) return 'due-soon'

  return 'upcoming'
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [location, setLocation] = useState('Tokyo, Japan')
  const [status, setStatus] = useState<Application['status']>('Saved')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewMode, setViewMode] = useState<
    'table' | 'kanban' | 'analytics'
  >('table')

  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [salaryCurrency, setSalaryCurrency] = useState('JPY')
  const [jobUrl, setJobUrl] = useState('')
  const [deadline, setDeadline] = useState('')
  const [appliedAt, setAppliedAt] = useState('')
  const [notes, setNotes] = useState('')  

  // Restore the user's login session when the app opens.
  useEffect(() => {
    let active = true

    apiRequest('/auth/me')
      .then(() => {
        if (active) setIsAuthenticated(true)
      })
      .catch(() => {
        if (active) setIsAuthenticated(false)
      })
      .finally(() => {
        if (active) setCheckingSession(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Load applications from PostgreSQL after authentication.
  useEffect(() => {
    if (!isAuthenticated) return

    let active = true

    setLoadingApplications(true)
    setError('')

    apiRequest<{ applications: Application[] }>('/applications')
      .then((data) => {
        if (active) setApplications(data.applications)
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load applications.')
        }
      })
      .finally(() => {
        if (active) setLoadingApplications(false)
      })

    return () => {
      active = false
    }
  }, [isAuthenticated])

  const resetForm = () => {
    setCompany('')
    setPosition('')
    setLocation('Tokyo, Japan')
    setStatus('Saved')
    setEditingId(null)
    setShowForm(false)
    setSalaryMin('')
    setSalaryMax('')
    setSalaryCurrency('JPY')
    setJobUrl('')
    setDeadline('')
    setAppliedAt('')
    setNotes('')
  }

  const openAddForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (application: Application) => {
    setCompany(application.company)
    setPosition(application.position)
    setLocation(application.location ?? '')
    setStatus(application.status)
    setEditingId(application.id)
    setShowForm(true)
    setSalaryMin(application.salary_min?.toString() ?? '')
    setSalaryMax(application.salary_max?.toString() ?? '')
    setSalaryCurrency(application.salary_currency || 'JPY')
    setJobUrl(application.job_url ?? '')
    setDeadline(application.deadline?.slice(0, 10) ?? '')
    setAppliedAt(application.applied_at?.slice(0, 10) ?? '')
    setNotes(application.notes ?? '')
  }

  const saveApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!company.trim() || !position.trim()) return

    setError('')

    const applicationData = {
      company: company.trim(),
      position: position.trim(),
      location: location.trim() || null,
      status,
      salary_min: salaryMin ? Number(salaryMin) : null,
      salary_max: salaryMax ? Number(salaryMax) : null,
      salary_currency: salaryCurrency,
      job_url: jobUrl.trim() || null,
      deadline: deadline || null,
      applied_at: appliedAt || null,
      notes: notes.trim() || null,
    }

    try {
      if (editingId !== null) {
        const data = await apiRequest<{ application: Application }>(
          `/applications/${editingId}`,
          {
            method: 'PUT',
            body: JSON.stringify(applicationData),
          }
        )

        setApplications((current) =>
          current.map((application) =>
            application.id === editingId ? data.application : application
          )
        )
      } else {
        const data = await apiRequest<{ application: Application }>(
          '/applications',
          {
            method: 'POST',
            body: JSON.stringify(applicationData),
          }
        )

        setApplications((current) => [data.application, ...current])
      }

      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save application.')
    }
  }

  const handleStatusChange = async (
    applicationId: string,
    newStatus: Application['status']
  ) => {
    const application = applications.find(
      (item) => item.id === applicationId
    )

    if (!application) return

    setError('')

    try {
      const data = await apiRequest<{ application: Application }>(
        `/applications/${applicationId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            company: application.company,
            position: application.position,
            location: application.location,
            status: newStatus,
            salary_min: application.salary_min,
            salary_max: application.salary_max,
            salary_currency: application.salary_currency,
            job_url: application.job_url,
            deadline: application.deadline,
            applied_at: application.applied_at,
            notes: application.notes,
          }),
        }
      )

      setApplications((current) =>
        current.map((item) =>
          item.id === applicationId ? data.application : item
        )
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update application status.'
      )
    }
  }

  const deleteApplication = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this application?'
    )

    if (!confirmed) return

    setError('')

    try {
      await apiRequest(`/applications/${id}`, {
        method: 'DELETE',
      })

      setApplications((current) =>
        current.filter((application) => application.id !== id)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete application.')
    }
  }

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      })

      setApplications([])
      setIsAuthenticated(false)
      setError('')
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log out.')
    }
  }

  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      `${application.company} ${application.position} ${application.location ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'All' || application.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const countByStatus = (value: Application['status']) =>
    applications.filter((application) => application.status === value).length

  if (checkingSession) {
    return <div className="login-page">Checking your session...</div>
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

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
            <button className="action-button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <p className="eyebrow">YOUR CAREER JOURNEY</p>
            <h1>Dashboard</h1>
            <p className="subtitle">
              Keep track of your journey toward a career in Japan.
            </p>
          </div>
          <button className="primary-button" onClick={openAddForm}>
            + Add application
          </button>
        </section>

        {error && (
          <div className="api-error" role="alert">
            {error}
          </div>
        )}

        
        {showForm && (
          <form className="application-form" onSubmit={saveApplication}>
            <h2>{editingId !== null ? 'Edit application' : 'New application'}</h2>

            <div className="form-grid">
              <label>
                Company
                <input
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="e.g. Sony"
                  required
                />
              </label>

              <label>
                Position
                <input
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  placeholder="e.g. Software Engineer"
                  required
                />
              </label>

              <label>
                Location
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Tokyo, Japan"
                />
              </label>

              <label>
                Status
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as Application['status'])
                  }
                >
                  <option>Saved</option>
                  <option>Applied</option>
                  <option>Interview</option>
                  <option>Offer</option>
                  <option>Rejected</option>
                </select>
              </label>

              <label>
                Minimum salary
                <input
                  type="number"
                  min="0"
                  value={salaryMin}
                  onChange={(event) => setSalaryMin(event.target.value)}
                  placeholder="5000000"
                />
              </label>

              <label>
                Maximum salary
                <input
                  type="number"
                  min="0"
                  value={salaryMax}
                  onChange={(event) => setSalaryMax(event.target.value)}
                  placeholder="7000000"
                />
              </label>

              <label>
                Salary currency
                <select
                  value={salaryCurrency}
                  onChange={(event) => setSalaryCurrency(event.target.value)}
                >
                  <option value="JPY">JPY (¥)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </label>

              <label>
                Job posting URL
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(event) => setJobUrl(event.target.value)}
                  placeholder="https://company.com/jobs/123"
                />
              </label>

              <label>
                Application deadline
                <input
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </label>

              <label>
                Date applied
                <input
                  type="date"
                  value={appliedAt}
                  onChange={(event) => setAppliedAt(event.target.value)}
                />
              </label>

              <label>
                Notes
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Interview details, requirements, contact information..."
                  rows={3}
                />
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={resetForm}>
                Cancel
              </button>
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
          <div className="view-switcher">
            <button
              className={viewMode === 'table' ? 'view-button active' : 'view-button'}
              onClick={() => setViewMode('table')}
            >
              ☷ Table
            </button>

            <button
              className={viewMode === 'kanban' ? 'view-button active' : 'view-button'}
              onClick={() => setViewMode('kanban')}
            >
              ▦ Kanban Board
            </button>

            <button
              className={viewMode === 'analytics' ? 'view-button active' : 'view-button'}
              onClick={() => setViewMode('analytics')}
            >
              ◷ Analytics
            </button>
          </div>

          {viewMode === 'table' ? (
            <>

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

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All statuses</option>
              <option value="Saved">Saved</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>COMPANY</th>
                  <th>POSITION</th>
                  <th>JOB POSTING</th>
                  <th>LOCATION</th>
                  <th>SALARY</th>
                  <th>DEADLINE</th>
                  <th>APPLIED</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map((application) => (
                  <tr key={application.id}>
                    <td className="company-cell">
                      <div className="company-avatar">
                        {application.company.charAt(0).toUpperCase()}
                      </div>
                      {application.company}
                    </td>

                    <td>{application.position}</td>
                    <td>
                      {application.job_url ? (
                        <a
                          href={application.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="job-link"
                        >
                          View posting ↗
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{application.location || '—'}</td>
                    <td>{formatSalaryRange(application)}</td>
                    <td>
                      {application.deadline ? (
                        <span className={`deadline-badge ${getDeadlineStatus(application.deadline)}`}>
                          {formatDeadline(application.deadline)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td>
                      {application.applied_at
                        ? formatDeadline(application.applied_at)
                        : '—'}
                    </td>

                    <td>
                      <span className={`status-badge ${application.status.toLowerCase()}`}>
                        {application.status}
                      </span>
                    </td>

                    <td className="actions-cell">
                      <button
                        className="action-button"
                        onClick={() => openEditForm(application)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-button delete-button"
                        onClick={() => deleteApplication(application.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {!loadingApplications && filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      No applications found.
                    </td>
                  </tr>
                )}

                {loadingApplications && (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      Loading applications...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
            </>
          ) : viewMode === 'kanban' ? (
            <KanbanBoard
              applications={applications}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <AnalyticsDashboard applications={applications} />
          )}
        </section>

        <footer>
          Japan Career Tracker <span>Built to make your next move happen.</span>
        </footer>
      </main>
    </div>
  )
}

export default App
