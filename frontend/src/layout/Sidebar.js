export default function Sidebar({ setPage }) {
  return (
    <nav className="sidebar">
      <h3>Hospital</h3>
      <ul>
        <li onClick={() => setPage("dashboard")}>Dashboard</li>
        <li onClick={() => setPage("appointments")}>Appointments</li>
        <li onClick={() => setPage("reports")}>Reports</li>
        <li onClick={() => setPage("profile")}>Profile</li>
      </ul>
    </nav>
  );
}