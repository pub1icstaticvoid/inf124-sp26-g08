import React, { useState } from "react";
import './Settings.css';

export default function Settings() {
    const [theme, setTheme] = useState("dark");
    const [notifications, setNotifications] = useState({
        desktop: true,
        dms: true,
        mentions: true,
        canvas: true
    });

    function handleToggle(key) {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="settings-container">
            <h1 className="chat-header-text">Settings</h1>

            <section className="settings-section">
                <h3>Appearance</h3>
                <div className="setting-item">
                    <label>Theme</label>
                    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                    </select>
                </div>
            </section>

            <section className="settings-section">
                <h3>Notifications</h3>
                <div className="setting-item">
                    <input
                        type="checkbox"
                        id="desktop"
                        checked={notifications.desktop}
                        onChange={() => handleToggle("desktop")}
                    />
                    <label htmlFor="desktop">Enable desktop notifications</label>
                </div>

                <div className="notification-section">
                    <p>Enable notifications for:</p>

                    <div className="setting-item">
                        <input type="checkbox" checked={notifications.dms} onChange={() => handleToggle("dms")} />
                        <label>Direct Messages</label>
                    </div>

                    <div className="setting-item">
                        <input type="checkbox" checked={notifications.mentions} onChange={() => handleToggle("mentions")} />
                        <label>@Mentions</label>
                    </div>

                    <div className="setting-item">
                        <input type="checkbox" checked={notifications.canvas} onChange={() => handleToggle("canvas")} />
                        <label>Course announcements from Canvas</label>
                    </div>
                </div>
            </section>
        </div>
    );
};