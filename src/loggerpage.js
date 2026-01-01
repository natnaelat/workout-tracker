import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { db, auth } from "./firebase"; // Import Firebase setup
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,  updateDoc,  doc as firestoreDoc,
} from "firebase/firestore"; // For querying
import "./loggerpage.css";

const LogPage = () => {
  const location = useLocation();
  const exerciseName =
    new URLSearchParams(location.search).get("exercise") || "None";
  const getTodayStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [formData, setFormData] = useState({
    weight: "",
    sets: "",
    reps: "",
    date: getTodayStr(),
  });
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ weight: "", sets: "", reps: "", date: "" });

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
        const history = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWorkoutHistory(history);
      }
    };
    fetchWorkoutHistory();
  }, [exerciseName]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (entry) => {
    setEditingId(entry.id);
    setEditForm({ weight: entry.weight, sets: entry.sets, reps: entry.reps, date: entry.date });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!auth.currentUser) return;
    try {
      await updateDoc(firestoreDoc(db, "workouts", editingId), {
        weight: editForm.weight,
        sets: editForm.sets,
        reps: editForm.reps,
        date: editForm.date,
      });
      setWorkoutHistory((prev) =>
        prev.map((w) => (w.id === editingId ? { ...w, ...editForm } : w))
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error saving workout edit:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
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
      const newRef = await addDoc(collection(db, "workouts"), newLog);
      setWorkoutHistory((prev) => [...prev, { id: newRef.id, ...newLog }]);
      setFormData({ weight: "", sets: "", reps: "", date: getTodayStr() });
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (!auth.currentUser) return;
    const confirmed = window.confirm("Delete this workout entry?");
    if (!confirmed) return;
    try {
      await deleteDoc(firestoreDoc(db, "workouts", workoutId));
      setWorkoutHistory((prev) => prev.filter((w) => w.id !== workoutId));
    } catch (error) {
      console.error("Error deleting workout:", error);
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {workoutHistory.map((entry, index) => (
            <tr key={entry.id || index}>
              {editingId === entry.id ? (
                <>
                  <td>
                    <input
                      className="table-input"
                      type="number"
                      name="weight"
                      value={editForm.weight}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td>
                    <input
                      className="table-input"
                      type="number"
                      name="sets"
                      value={editForm.sets}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td>
                    <input
                      className="table-input"
                      type="number"
                      name="reps"
                      value={editForm.reps}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td>
                    <input
                      className="table-date-input"
                      type="date"
                      name="date"
                      value={editForm.date}
                      onChange={handleEditChange}
                    />
                  </td>
                  <td className="action-cell">
                    <button
                      className="save-btn"
                      onClick={handleSaveEdit}
                      title="Save"
                    >
                      💾
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={handleCancelEdit}
                      title="Cancel"
                    >
                      ✖️
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>{entry.weight}</td>
                  <td>{entry.sets}</td>
                  <td>{entry.reps}</td>
                  <td>{entry.date}</td>
                  <td className="action-cell">
                    <button
                      className="edit-btn"
                      onClick={() => handleEditClick(entry)}
                      onMouseEnter={(e) => {
                        const tr = e.currentTarget.closest("tr");
                        if (tr) tr.classList.add("no-row-hover");
                      }}
                      onMouseLeave={(e) => {
                        const tr = e.currentTarget.closest("tr");
                        if (tr) tr.classList.remove("no-row-hover");
                      }}
                      title="Edit set"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteWorkout(entry.id)}
                      onMouseEnter={(e) => {
                        const tr = e.currentTarget.closest("tr");
                        if (tr) tr.classList.add("no-row-hover");
                      }}
                      onMouseLeave={(e) => {
                        const tr = e.currentTarget.closest("tr");
                        if (tr) tr.classList.remove("no-row-hover");
                      }}
                      title="Delete set"
                    >
                      🗑️
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LogPage;
