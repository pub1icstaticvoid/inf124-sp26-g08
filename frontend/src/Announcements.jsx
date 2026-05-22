import './Announcements.css'

export default function Announcements({ groups }) {
  return (
    <div className="announcements-page">
      <h1 className="chat-header-text">Announcements</h1>

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
