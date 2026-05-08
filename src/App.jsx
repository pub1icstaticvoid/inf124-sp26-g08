import { useState, useEffect, useRef } from 'react'
import LoginScreen from "./LoginScreen";
import './App.css'
import Profile from "./Profile"
import Settings from './Settings';

const placeholder_data = {
  DMs: [
    { id: 1, name: "Friend A", lastMsg: "hi" },
    { id: 2, name: "Friend B", lastMsg: "salutations" }
  ],
  Classes: [
    { id: 3, name: "INF 124", lastMsg: "do a2" },
    { id: 4, name: "ICS 31", lastMsg: "do python"}
  ],
  Clubs: [
    { id: 5, name: "Chess Club", lastMsg: "fork" },
    { id: 6, name: "VGDC", lastMsg: "do pitch project"}
  ]
}

const placeholder_messages = [
  { id: 101, user: "Friend A", text: "no way" },
  { id: 102, user: "You", text: "hi" },
  { id: 103, user: "Friend B", text: "hi" },
]

function App({ onLogout }) {
  const [activeTab, setActiveTab] = useState("DMs");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState(placeholder_messages);

  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const messagesEndRef = useRef(null);

  const handleSendMessage = () => {
    if (messageInput.trim() === "") return;

    const newMessage = {
      id: Date.now(),
      user: "You",
      text: messageInput,
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  return (
    <div className={`app-container ${activeTab === "Profile" || activeTab === "Settings" ? "non-messaging-mode" : ""}`}>

      <nav className='nav-sidebar'>
        <button onClick={() => setActiveTab("DMs")}>DMs</button>
        <button onClick={() => setActiveTab("Classes")}>Classes</button>
        <button onClick={() => setActiveTab("Clubs")}>Clubs</button>
        <button onClick={() => setActiveTab("Profile")}>Profile</button>
        <button onClick={() => setActiveTab("Settings")}>Settings</button>

        <button className="logout-btn" onClick={onLogout}>Log Out</button>
      </nav>

      {activeTab !== "Profile" && activeTab !== "Settings" && (
        <aside className='list-sidebar'>
          <div className='search-box'>
            <input type='text' placeholder='Search' />
            <button>+</button>
          </div>

          <div className='chat-list'>
            { placeholder_data[activeTab].map((item) => (
              <div key={item.id} className='chat-item'>
                <strong># {item.name}</strong>
                <p style={{fontSize: '12px'}}>{item.lastMsg}</p>
              </div>
            ))}
          </div>
        </aside>
      )}

      <main className='chat-window'>

        {activeTab === "Profile" ? (
          <Profile />
        ) : activeTab === "Settings" ? (
          <Settings theme={theme} setTheme={setTheme} />
        ) : (
          <>
            <header className='chat-header'>
              <h2 className='chat-header-text'># current-chat-name</h2>
            </header>

            <div className='messages'>
              {messages.map((msg) => (
                <div key={msg.id} className='message-bubble'>
                  <span className={`${msg.user === "You" ? "my-message" : "text-recipient"}`}>{msg.user}: </span>
                  <span className="text-message">{msg.text}</span>
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>

            <div className='input-area'>
              <input
                type="text"
                placeholder="Message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App
