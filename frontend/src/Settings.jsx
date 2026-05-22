import './Settings.css';

const ACCENT_COLORS = [
  { name: 'Purple', light: '#8b5cf6', dark: '#a78bfa', hover: '#7c3aed', darkHover: '#c4b5fd' },
  { name: 'Blue', light: '#3b82f6', dark: '#60a5fa', hover: '#2563eb', darkHover: '#93bbfd' },
  { name: 'Teal', light: '#14b8a6', dark: '#2dd4bf', hover: '#0d9488', darkHover: '#5eead4' },
  { name: 'Green', light: '#22c55e', dark: '#4ade80', hover: '#16a34a', darkHover: '#86efac' },
  { name: 'Orange', light: '#f97316', dark: '#fb923c', hover: '#ea580c', darkHover: '#fdba74' },
  { name: 'Pink', light: '#ec4899', dark: '#f472b6', hover: '#db2777', darkHover: '#f9a8d4' },
  { name: 'Red', light: '#ef4444', dark: '#f87171', hover: '#dc2626', darkHover: '#fca5a5' },
  { name: 'Amber', light: '#f59e0b', dark: '#fbbf24', hover: '#d97706', darkHover: '#fcd34d' },
];

export default function Settings({ theme, setTheme, accentIndex, setAccentIndex }) {
  return (
    <div className="settings-container">
      <h1 className="chat-header-text">Settings</h1>

      <section className="settings-section">
        <h3>Appearance</h3>
        <div className="setting-item">
          <label>Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </section>

      <section className="settings-section">
        <h3>Accent Color</h3>
        <div className="accent-picker">
          {ACCENT_COLORS.map((color, i) => (
            <button
              key={color.name}
              type="button"
              className={`accent-swatch ${i === accentIndex ? 'accent-swatch-active' : ''}`}
              style={{ backgroundColor: theme === 'dark' ? color.dark : color.light }}
              onClick={() => setAccentIndex(i)}
              title={color.name}
            />
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h3>Notifications</h3>
        <div className="setting-item">
          <input type="checkbox" id="desktop" defaultChecked />
          <label htmlFor="desktop">Enable desktop notifications</label>
        </div>

        <div className="notification-section">
          <p>Enable notifications for:</p>
          <div className="setting-item">
            <input type="checkbox" id="dms" defaultChecked />
            <label htmlFor="dms">Direct Messages</label>
          </div>
          <div className="setting-item">
            <input type="checkbox" id="mentions" defaultChecked />
            <label htmlFor="mentions">@Mentions</label>
          </div>
          <div className="setting-item">
            <input type="checkbox" id="canvas" defaultChecked />
            <label htmlFor="canvas">Course announcements from Canvas</label>
          </div>
        </div>
      </section>
    </div>
  );
}
