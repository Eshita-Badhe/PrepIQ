function StartMenu({ openAppByName, onClose }) {
  // Use your existing program lists, system links, user info, etc.
  // See your reference for "allPrograms", "recent", "rightLinks"
  return (
    <div className="start-overlay" onClick={onClose}>
      <div className="start-menu" style={{
         background:"rgba(255,255,255,.91)",
         backdropFilter:"blur(12px)",
         boxShadow: "0 18px 54px rgba(16,24,48,0.37)"
      }} 
      onClick={e => e.stopPropagation()}>
        <div className="start-left">
          <div style={{ fontWeight: 700 }}>All Programs</div>
          {/* All programs grid */}
          <div className="programs">
            {/* Map allPrograms as tiles, see your code above */}
          </div>
          <div style={{ marginTop: 12, fontWeight: 600 }}>Recently opened</div>
          {/* Recent list */}
          <div className="recent-list">
            {/* Map recent */}
          </div>
          <div className="start-search">
            {/* Search bar with filter logic */}
          </div>
        </div>
        <div className="start-right">
          {/* User panel, links */}
          <div className="user" style={{ marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 6,
              background: "rgba(255,255,255,0.11)", display: "flex",
              alignItems:"center", justifyContent:"center"
            }}>👤</div>
            <div>
              <div style={{ fontWeight: 700 }}>User</div>
              <div style={{ fontSize: 12, color: "#aaa" }}>Local Account</div>
            </div>
          </div>
          <ul>
            {/* List all system links, each triggers openAppByName(label) */}
          </ul>
          <div className="start-footer" style={{ borderTop:"1px solid #e2e2e2", color: "#222" }}>
            <div className="left">Signed in as <b>User</b></div>
            <div className="right">{/* Shut down dropdown */}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default StartMenu;