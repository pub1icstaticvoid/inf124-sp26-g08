import "./Profile.css";
import { useState, useEffect } from "react";
import { apiGet, apiPut } from "./api";

// accept currentUser as a prop so we know which user's profile to load
export default function Profile({ currentUser }) {
  const [profile, setProfile]   = useState({});
  const [bio, setBio]           = useState("");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState("");

  // fetch the user's saved profile from GET /api/users/:userId/profile
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

  // save changes back to PUT /api/users/:userId/profile
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

  if (loading) {
    return <div className="profile-tab" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <p>Loading…</p>
    </div>;
  }

  return (
    <div className="profile-tab">
      <div className="profile-tab-top">
        <div className="profile-user-section">
          <div className="profile-avatar">
            {/* use real avatar if set, else fall back to initials */}
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : (currentUser?.username?.[0] ?? "?").toUpperCase()
            }
          </div>

          <div className="profile-user-info">
            {/* show real username and email from currentUser */}
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
              {/* editable input for position */}
              <input
                style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                value={profile.position ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, position: e.target.value }))}
                placeholder="Student, TA, LA…"
              />
            </div>

            <div className="profile-left-section">
              <h3>Department</h3>
              <input
                style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                value={profile.department ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                placeholder="Major / Minor"
              />
            </div>

            <div className="profile-left-section">
              <h3>Graduation Year</h3>
              <input
                style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                value={profile.graduationYear ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, graduationYear: e.target.value }))}
                placeholder="2026"
              />
            </div>
          </div>
        </div>

        <div className="profile-clubs-section">
          <h3>Clubs</h3>
          <div className="profile-clubs-box">
            <div className="profile-clubs-header">
              <span>Club Name</span>
              <span>Position</span>
            </div>

            {/* render real clubs from profile.clubs, falling back to two empty rows */}
            {(profile.clubs?.length ? profile.clubs : [{ name: '', role: '' }, { name: '', role: '' }])
              .map((club, i) => (
                <div key={i} className="profile-club-row">
                  <span>{club.name || `Club ${i + 1}`}</span>
                  <span>{club.role || 'Member'}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 24px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
        {saveMsg && (
          <span style={{ fontSize: '13px', color: saveMsg === 'Saved!' ? 'var(--accent)' : '#ef4444' }}>
            {saveMsg}
          </span>
        )}
      </div>
    </div>
  );
}