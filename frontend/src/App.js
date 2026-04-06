import React, { useEffect, useState } from "react";
import api, { setAuthToken } from "./api/api";
import Login from "./pages/Login";
import StaffDashboard from "./pages/StaffDashboard";
import PatientDashboard from "./pages/PatientDashboard";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null); // PATIENT or STAFF

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setAuthToken(token);

    api.get("me/")
      .then(res => {
        setUserType(res.data.type);
        setLoggedIn(true);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setLoggedIn(false);
      });
  }, []);

  if (!loggedIn) {
    return <Login onLogin={() => window.location.reload()} />;
  }

  if (userType === "PATIENT") {
    return <PatientDashboard />;
  }

  if (userType === "STAFF") {
    return <StaffDashboard />;
  }

  return <p>Unknown user type</p>;
}

export default App;
