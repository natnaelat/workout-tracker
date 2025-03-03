import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { db, auth } from "./firebase"; // Import Firebase setup
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"; // For querying
import "./loggerpage.css";

const LogPage = () => {
  const location = useLocation();
  const exerciseName =
    new URLSearchParams(location.search).get("exercise") || "None";
  const [formData, setFormData] = useState({
    weight: "",
    sets: "",
    reps: "",
    date: "",
  });
  const [workoutHistory, setWorkoutHistory] = useState([]);

  // Fetch workout history for the current user and exercise
  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      if (auth.currentUser) {
        const userId = auth.currentUser.uid; // Get current user ID
        const workoutCollection = collection(db, "workouts");
        const workoutQuery = query(
          workoutCollection,
          where("userId", "==", userId), // Filter by current user
          where("exerciseName", "==", exerciseName) // Filter by exercise
        );
        const querySnapshot = await getDocs(workoutQuery);
        const history = querySnapshot.docs.map((doc) => doc.data());
        setWorkoutHistory(history);
      }
    };
    fetchWorkoutHistory();
  }, [exerciseName]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (auth.currentUser) {
      const userId = auth.currentUser.uid; // Get current user ID
      const newLog = {
        ...formData,
        userId: userId, // Store the user ID
        exerciseName: exerciseName, // Store exercise name
      };

      // Add the new log to Firestore
      await addDoc(collection(db, "workouts"), newLog);
      setWorkoutHistory((prev) => [...prev, newLog]);
      setFormData({ weight: "", sets: "", reps: "", date: "" });
    }
  };

  return (
    <div>
      <h1>Workout Tracker</h1>
      <h3>Exercise: {exerciseName}</h3>

      <form onSubmit={handleFormSubmit}>
        <div className="input-row">
          <div className="input-group">
            <label htmlFor="weight">Weight (lbs):</label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="sets">Set:</label>
            <input
              type="number"
              id="sets"
              name="sets"
              value={formData.sets}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="reps">Reps:</label>
            <input
              type="number"
              id="reps"
              name="reps"
              value={formData.reps}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        <button type="submit">Add Set</button>
      </form>

      <h2>Workout History</h2>
      <table>
        <thead>
          <tr>
            <th>Weight (lbs)</th>
            <th>Sets</th>
            <th>Reps</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {workoutHistory.map((entry, index) => (
            <tr key={index}>
              <td>{entry.weight}</td>
              <td>{entry.sets}</td>
              <td>{entry.reps}</td>
              <td>{entry.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LogPage;
