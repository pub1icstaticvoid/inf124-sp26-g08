import { useEffect, useState } from 'react'
import './Announcements.css'
import { apiGet } from './api'

// Shown when the DB has no announcements yet or the backend is unreachable
const FALLBACK_GROUPS = [
  {
    id: 'ann-inf124',
    label: 'INF 124',
    announcements: [
      {
        id: 'inf124-1',
        title: 'Assignment 2',
        body: 'Submit the prototype and peer review form before Friday at 11:59 PM.',
      },
      {
        id: 'inf124-2',
        title: 'Discussion Section',
        body: 'This week we are reviewing chat interface usability patterns and message states.',
      },
    ],
  },
  {
    id: 'ann-ics31',
    label: 'ICS 31',
    announcements: [
      {
        id: 'ics31-1',
        title: 'Lab Update',
        body: 'Office hours move to 4 PM in DBH 4011 because of the review session.',
      },
    ],
  },
  {
    id: 'ann-vgdc',
    label: 'VGDC',
    announcements: [
      {
        id: 'vgdc-1',
        title: 'Pitch Review',
        body: "Bring the newest deck and vertical slice notes to Thursday's meeting.",
      },
      {
        id: 'vgdc-2',
        title: 'Art Sync',
        body: 'Character concept feedback closes tonight so the team can lock sprint tasks.',
      },
      {
        id: 'vgdc-3',
        title: 'Playtest Signups',
        body: 'Volunteer slots are open for the Saturday showcase build playtest.',
      },
    ],
  },
]

export default function Announcements() {
  const [groups,  setGroups]  = useState(FALLBACK_GROUPS)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    apiGet('/announcements')
      .then((data) => {
        if (data.groups && data.groups.length > 0) {
          setGroups(data.groups)
        } else {
          // DB is empty — keep showing fallback data
          setGroups(FALLBACK_GROUPS)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch announcements:', err)
        setError('Could not load announcements from server.')
        // Backend is unreachable — keep showing fallback data
        setGroups(FALLBACK_GROUPS)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="announcements-page">
        <h1 className="chat-header-text">Announcements</h1>
        <p style={{ color: 'var(--text)', opacity: 0.6, marginTop: 8 }}>Loading…</p>
      </div>
    )
  }

  return (
    <div className="announcements-page">
      <h1 className="chat-header-text">Announcements</h1>

      {error && (
        <p style={{ color: 'var(--text)', opacity: 0.5, fontSize: 13, marginBottom: 16 }}>
          {error} Showing cached announcements.
        </p>
      )}

      <div className="announcements-groups">
        {groups.map((group) => (
          <section key={group.id} className="announcement-row">
            <div className="announcement-group-label">{group.label}</div>

            <div className="announcement-cards">
              {group.announcements.map((announcement) => (
                <article key={announcement.id} className="announcement-card">
                  <h3>{announcement.title}</h3>
                  <p>{announcement.body}</p>
                </article>
              ))}
            </div>

            <div className="announcement-history">
              <span>Past</span>
              <span>Announcements</span>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}