import './AnalyticsDashboard.css'

type Application = {
  id: string
  company: string
  position: string
  status: 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected'
  applied_at: string | null
}

type AnalyticsDashboardProps = {
  applications: Application[]
}

const statuses: Application['status'][] = [
  'Saved',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
]

function AnalyticsDashboard({ applications }: AnalyticsDashboardProps) {
  const total = applications.length

  const countByStatus = (status: Application['status']) =>
    applications.filter((app) => app.status === status).length

  const interviews = countByStatus('Interview')
  const offers = countByStatus('Offer')
  const active = countByStatus('Saved') + countByStatus('Applied') + interviews

  const interviewProgressRate =
    total > 0 ? Math.round(((interviews + offers) / total) * 100) : 0

  const offerRate =
    total > 0 ? Math.round((offers / total) * 100) : 0

  const monthlyActivity = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - index))

    const month = date.getMonth()
    const year = date.getFullYear()

    const count = applications.filter((app) => {
      if (!app.applied_at) return false

      const appliedDate = new Date(`${app.applied_at.slice(0, 10)}T12:00:00`)

      return (
        appliedDate.getMonth() === month &&
        appliedDate.getFullYear() === year
      )
    }).length

    return {
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      count,
    }
  })

  const maxMonthlyCount = Math.max(
    ...monthlyActivity.map((month) => month.count),
    1
  )

  return (
    <div className="analytics-dashboard">
      <div className="analytics-heading">
        <div>
          <h2>Analytics Overview</h2>
          <p>Understand how your job search is progressing.</p>
        </div>
      </div>

      <div className="analytics-stats">
        <div className="analytics-card">
          <span>Total Applications</span>
          <strong>{total}</strong>
        </div>

        <div className="analytics-card">
          <span>Active Applications</span>
          <strong>{active}</strong>
        </div>

        <div className="analytics-card">
          <span>Interview Progress Rate</span>
          <strong>{interviewProgressRate}%</strong>
        </div>

        <div className="analytics-card">
          <span>Offer Rate</span>
          <strong>{offerRate}%</strong>
        </div>
      </div>

      <div className="analytics-panels">
        <section className="analytics-panel">
          <h3>Applications by Status</h3>

          {statuses.map((status) => {
            const count = countByStatus(status)
            const percentage = total > 0 ? (count / total) * 100 : 0

            return (
              <div className="status-bar-item" key={status}>
                <div className="status-bar-label">
                  <span>{status}</span>
                  <strong>{count}</strong>
                </div>

                <div className="status-bar-track">
                  <div
                    className={`status-bar-fill ${status.toLowerCase()}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </section>

        <section className="analytics-panel">
          <h3>Application Activity</h3>
          <p className="analytics-subtitle">Applications submitted over the last 6 months</p>

          <div className="monthly-chart">
            {monthlyActivity.map((month) => (
              <div className="monthly-bar-item" key={month.label}>
                <strong>{month.count}</strong>

                <div className="monthly-bar-track">
                  <div
                    className="monthly-bar-fill"
                    style={{
                      height: `${(month.count / maxMonthlyCount) * 100}%`,
                    }}
                  />
                </div>

                <span>{month.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
