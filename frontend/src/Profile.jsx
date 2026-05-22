import "./Profile.css";
import { useState } from "react";

export default function Profile() {
    const [bio, setBio] = useState("");

    return (
        <div className="profile-tab">
            <div className="profile-tab-top">
                <div className="profile-user-section">
                    <div className="profile-avatar">Avatar</div>

                    <div className="profile-user-info">
                        <h1>Username</h1>
                        <p className="email">Email Address</p>
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
                            <p>(Student, TA, LA, etc.)</p>
                        </div>

                        <div className="profile-left-section">    
                            <h3>Department</h3>
                            <p>Major</p>
                            <p>Minor</p>
                        </div> 

                        <div className="profile-left-section">
                            <h3>Graduation Year</h3>
                            <p>Year</p>
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

                        <div className="profile-club-row">
                            <span>Club 1</span>
                            <span>Member</span>
                        </div>

                        <div className="profile-club-row">
                            <span>Club 2</span>
                            <span>Officer</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}