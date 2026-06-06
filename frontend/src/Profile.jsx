import "./Profile.css";
import { useState, useEffect } from "react";
import { apiGet, apiPut } from "./api";

export default function Profile({ currentUser }) {
  const [profile,      setProfile]      = useState({});
  const [bio,          setBio]          = useState("");
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState("");

  // Club-add flow
  const [showAddForm,        setShowAddForm]        = useState(false);
  const [clubSearch,         setClubSearch]         = useState("");
  const [clubResults,        setClubResults]        = useState([]);
  const [clubSearchLoading,  setClubSearchLoading]  = useState(false);
  const [selectedClub,       setSelectedClub]       = useState(null); // { id, name }
  const [newClubRole,        setNewClubRole]        = useState("");

  // Load profile
  useEffect(() => {
    if (!currentUser?.id) return;
    setLoading(true);
    apiGet(`/users/${currentUser.id}/profile`)
      .then((data) => {
        setProfile(data.profile || {});
        setBio(data.profile?.bio || "");
      })
      .catch((err) => console.error("Failed to load profile:", err))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  // Debounced club search — calls GET /clubs/search?userId=&q=
  useEffect(() => {
    if (!showAddForm || !clubSearch.trim()) {
      setClubResults([]);
      return;
    }

    setClubSearchLoading(true);
    const timer = setTimeout(() => {
      apiGet(`/clubs/search?userId=${currentUser.id}&q=${encodeURIComponent(clubSearch.trim())}`)
        .then((data) => {
          // Filter out clubs the user already has on their profile
          const alreadyAdded = new Set((profile.clubs ?? []).map((c) => c.name));
          setClubResults((data.clubs ?? []).filter((c) => !alreadyAdded.has(c.name)));
        })
        .catch((err) => console.error("Club search failed:", err))
        .finally(() => setClubSearchLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [clubSearch, showAddForm, currentUser?.id, profile.clubs]);

  const handleSave = async () => {
    if (!currentUser?.id) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await apiPut(`/users/${currentUser.id}/profile`, {
        bio,
        avatarUrl:      profile.avatarUrl      ?? "",
        position:       profile.position       ?? "",
        department:     profile.department     ?? "",
        graduationYear: profile.graduationYear ?? "",
        clubs:          profile.clubs          ?? [],
      });
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (err) {
      setSaveMsg("Save failed.");
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectClub = (club) => {
    setSelectedClub({ id: club.id ?? club._id, name: club.name });
    setClubSearch("");
    setClubResults([]);
  };

  const handleAddClub = () => {
    if (!selectedClub || !newClubRole.trim()) return;
    setProfile((p) => ({
      ...p,
      clubs: [...(p.clubs ?? []), { name: selectedClub.name, role: newClubRole.trim() }],
    }));
    resetAddForm();
  };

  const handleRemoveClub = (index) => {
    setProfile((p) => ({
      ...p,
      clubs: (p.clubs ?? []).filter((_, i) => i !== index),
    }));
  };

  const resetAddForm = () => {
    setShowAddForm(false);
    setClubSearch("");
    setClubResults([]);
    setSelectedClub(null);
    setNewClubRole("");
  };

  if (loading) {
    return (
      <div className="profile-tab" style={{ justifyContent: "center", alignItems: "center" }}>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="profile-tab">
      <div className="profile-tab-top">
        <div className="profile-user-section">
          <div className="profile-avatar">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="avatar"
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              (currentUser?.username?.[0] ?? "?").toUpperCase()
            )}
          </div>

          <div className="profile-user-info">
            <h1>{currentUser?.username ?? "Username"}</h1>
            <p className="email">{currentUser?.email ?? "Email Address"}</p>
          </div>
        </div>

        <div className="profile-bio-section">
          <h3 className="profile-text">Bio</h3>
          <div className="profile-bio-box">
            <textarea
              className="bio-input"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write your bio here"
            />
          </div>
        </div>
      </div>

      <div className="profile-tab-bottom">
        <div className="profile-left-info">
          <h3>Basic info</h3>
          <div className="profile-info-block">
            <div className="profile-left-section">
              <h3>Position</h3>
              <input
                style={{ padding: "4px 8px", fontSize: "0.9rem" }}
                value={profile.position ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, position: e.target.value }))}
                placeholder="Student, TA, LA…"
              />
            </div>

            <div className="profile-left-section">
              <h3>Department</h3>
              <input
                style={{ padding: "4px 8px", fontSize: "0.9rem" }}
                value={profile.department ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                placeholder="Major / Minor"
              />
            </div>

            <div className="profile-left-section">
              <h3>Graduation Year</h3>
              <input
                style={{ padding: "4px 8px", fontSize: "0.9rem" }}
                value={profile.graduationYear ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, graduationYear: e.target.value }))}
                placeholder="2026"
              />
            </div>
          </div>
        </div>

        {/* ── Clubs ── */}
        <div className="profile-clubs-section">
          <h3>Clubs</h3>
          <div className="profile-clubs-box">

            {/* Header — only visible when there are rows or the form is open */}
            {((profile.clubs?.length ?? 0) > 0 || showAddForm) && (
              <div className="profile-clubs-header">
                <span>Club Name</span>
                <span>Position</span>
                <span />
              </div>
            )}

            {/* Empty state */}
            {!profile.clubs?.length && !showAddForm && (
              <p className="profile-clubs-empty">No clubs added yet.</p>
            )}

            {/* Club rows */}
            {(profile.clubs ?? []).map((club, i) => (
              <div key={i} className="profile-club-row">
                <span>{club.name}</span>
                <span>{club.role}</span>
                <button
                  type="button"
                  className="profile-club-remove"
                  onClick={() => handleRemoveClub(i)}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Add club*/}
            {showAddForm && (
              <div className="profile-club-add-form">
                {!selectedClub ? (
                  /* search for a club */
                  <div className="profile-club-search-wrap">
                    <input
                      type="text"
                      className="profile-club-search-input"
                      placeholder="Search for a club…"
                      value={clubSearch}
                      onChange={(e) => setClubSearch(e.target.value)}
                      autoFocus
                    />

                    {/* Results dropdown */}
                    {(clubResults.length > 0 || clubSearchLoading || (clubSearch.trim() && !clubSearchLoading)) && (
                      <ul className="profile-club-results">
                        {clubSearchLoading && (
                          <li className="profile-club-results-info">Searching…</li>
                        )}
                        {!clubSearchLoading && clubResults.length === 0 && clubSearch.trim() && (
                          <li className="profile-club-results-info">No clubs found.</li>
                        )}
                        {clubResults.map((club) => (
                          <li
                            key={club.id ?? club._id}
                            onClick={() => handleSelectClub(club)}
                          >
                            <span className="profile-club-result-name">{club.name}</span>
                            {club.description && (
                              <span className="profile-club-result-desc">{club.description}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    <button type="button" className="profile-club-add-cancel" onClick={resetAddForm}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  /* Step 2 — enter a role */
                  <div className="profile-club-role-wrap">
                    <div className="profile-club-selected-name">
                      <span>📌</span>
                      <strong>{selectedClub.name}</strong>
                    </div>

                    <input
                      type="text"
                      placeholder="Your role (e.g. Member, Officer…)"
                      value={newClubRole}
                      onChange={(e) => setNewClubRole(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddClub(); }}
                      autoFocus
                    />

                    <div className="profile-club-add-actions">
                      <button
                        type="button"
                        className="profile-club-add-confirm"
                        onClick={handleAddClub}
                        disabled={!newClubRole.trim()}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className="profile-club-add-cancel"
                        onClick={() => { setSelectedClub(null); setNewClubRole(""); }}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trigger button — hidden while form is open */}
            {!showAddForm && (
              <button
                type="button"
                className="profile-add-club-btn"
                onClick={() => setShowAddForm(true)}
              >
                + Add Club
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding:      "10px 24px",
            background:   "var(--accent)",
            color:        "#fff",
            border:       "none",
            borderRadius: "var(--radius)",
            fontWeight:   600,
            cursor:       saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
        {saveMsg && (
          <span style={{
            fontSize: "13px",
            color: saveMsg === "Saved!" ? "var(--accent)" : "#ef4444",
          }}>
            {saveMsg}
          </span>
        )}
      </div>
    </div>
  );
}