import React, { useState } from "react";
import Login from "./pages/Login";
import Patients from "./pages/Patients";
import { setAuthToken } from "./api/api";

function App() {
  const token = localStorage.getItem("token");
  const [loggedIn, setLoggedIn] = useState(!!token);

  if (token) {
    setAuthToken(token);
  }

  return (
    <div>
      {loggedIn ? <Patients /> : <Login onLogin={() => setLoggedIn(true)} />}
    </div>
  );
}

export default App;