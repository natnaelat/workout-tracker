import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase"; // Import from firebase.js
import "./App.css";
import ExercisePage from "./exercisepage";
import LogPage from "./loggerpage";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("App component mounted");

    // Handle auth state changes first
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log(
        "Auth state changed:",
        currentUser ? "User logged in" : "No user"
      );
      setUser(currentUser);
      setLoading(false);
    });

    // Then check for redirect results
    const checkRedirectResult = async () => {
      try {
        console.log("Checking redirect result...");
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("User signed in after redirect:", result.user.email);
        }
      } catch (error) {
        console.error("Redirect result error:", error);
      }
    };

    checkRedirectResult();

    return () => unsubscribe();
  }, []);

  const handleSignIn = () => {
    console.log("Initiating sign in...");
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider).catch((error) => {
      console.error("Sign in error:", error);
      setLoading(false);
    });
  };

  const signOutRedirect = () => {
    signOut(auth)
      .then(() => {
        console.log("Signed out successfully");
      })
      .catch((error) => {
        console.error("Sign out error:", error);
      });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#141414",
          color: "white",
        }}
      >
        <h1 style={{ marginBottom: "20px" }}>Workout Tracker</h1>
        <button
          style={{
            padding: "15px 25px",
            fontSize: "18px",
            background: "#0e3c91",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={handleSignIn}
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {/* Navigation Bar */}
        <nav className="navbar">
          <div className="navbar__container">
            <Link to="/" id="navbar__logo">
              <i className="fas fa-dumbbell"></i> Workout Tracker
            </Link>
            <div className="navbar__toggle" id="mobile-menu">
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </div>
            <ul className="navbar__menu">
              <li className="navbar__item">
                <Link to="/" className="navbar__links" id="home-link">
                  Home
                </Link>
              </li>
              <li className="navbar__item">
                <Link
                  to="/exercise"
                  className="navbar__links"
                  id="exercise-link"
                >
                  Logs
                </Link>
              </li>
              <li className="navbar__btn">
                <button className="button" onClick={signOutRedirect}>
                  Sign Out
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Routes for the app */}
        <Routes>
          {/* Home Route */}
          <Route
            path="/"
            element={
              <>
                <div className="main">
                  <div className="main__container">
                    <div className="main__content">
                      <h1>Improve Your Health.</h1>
                      <h2>Reach Your Goals.</h2>
                      {/* Change to Link for navigation */}
                      <Link to="/exercise">
                        <button className="main__btn">Get Started</button>
                      </Link>
                    </div>
                    <div className="main__img--container">
                      <img
                        src="/images/pic1.svg"
                        alt="Workout illustration"
                        id="main__img"
                      />
                    </div>
                  </div>
                </div>
                <div className="services">
                  <h1>Change Your Life Today</h1>
                  <div className="services__container">
                    <div className="services__card">
                      <h2>See Change</h2>
                      <p>Start Today</p>
                      {/* Change to Link for navigation */}
                      <Link to="/exercise">
                        <button className="button get-started">
                          Get Started
                        </button>
                      </Link>
                    </div>
                    <div className="services__card">
                      <h2>Are you Ready?</h2>
                      <p>Take the leap</p>
                      {/* Change to Link for navigation */}
                      <Link to="/exercise">
                        <button className="button get-started">
                          Get Started
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            }
          />
          {/* Exercise Page Route */}
          <Route path="/exercise" element={<ExercisePage />} />
          {/* Log Page Route */}
          <Route path="/log" element={<LogPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
