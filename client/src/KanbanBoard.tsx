
import { useState } from 'react'
import './KanbanBoard.css'

type Application = {
  id: string
  company: string
  position: string
  location: string | null
  status: 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected'
  deadline: string | null
  salary_min: number | string | null
  salary_max: number | string | null
  salary_currency: string
  job_url: string | null
  applied_at: string | null
  notes: string | null
}

type KanbanBoardProps = {
  applications: Application[]
  onStatusChange: (
    applicationId: string,
    newStatus: Application['status']
  ) => void
}

const columns: Application['status'][] = [
  'Saved',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
]

function KanbanBoard({
  applications,
  onStatusChange,
}: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)

  function handleDrop(newStatus: Application['status']) {
    if (draggedId) {
      onStatusChange(draggedId, newStatus)
    }

    setDraggedId(null)
  }

  return (
    <div className="kanban-board">
      {columns.map((status) => {
        const columnApplications = applications.filter(
          (application) => application.status === status
        )

        return (
          <div
            className="kanban-column"
            key={status}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(status)}
          >
            <div className="kanban-column-header">
              <h3>{status}</h3>
              <span>{columnApplications.length}</span>
            </div>

            <div className="kanban-cards">
              {columnApplications.map((application) => (
                <div
                  className={`kanban-card ${
                    draggedId === application.id ? 'dragging' : ''
                  }`}
                  key={application.id}
                  draggable
                  onDragStart={() => setDraggedId(application.id)}
                  onDragEnd={() => setDraggedId(null)}
                >
                  <h4>{application.company}</h4>
                  <p>{application.position}</p>

                  {application.location && (
                    <span className="kanban-location">
                      {application.location}
                    </span>
                  )}

                  {application.deadline && (
                    <span className="kanban-deadline">
                      Deadline: {application.deadline.slice(0, 10)}
                    </span>
                  )}

                  {application.job_url && (
                    <a
                      href={application.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View posting ↗
                    </a>
                  )}
                </div>
              ))}

              {columnApplications.length === 0 && (
                <p className="kanban-empty">
                  No applications yet
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default KanbanBoard
