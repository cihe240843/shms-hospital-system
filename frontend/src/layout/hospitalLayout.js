import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import "./hospital.css";

export default function HospitalLayout({ children, setPage, onLogout }) {
  return (
    <div className="hospital">
      <Sidebar setPage={setPage} />

      <div className="main">
        <Header onLogout={onLogout} />
        <div className="content">{children}</div>
        <Footer />
      </div>
    </div>
  );
}