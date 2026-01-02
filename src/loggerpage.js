import React, { useState, useEffect, useRef } from "react";
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
  const [filters, setFilters] = useState({});
  const [availableFilters, setAvailableFilters] = useState({ weight: [], sets: [], reps: [], date: [] });
  const [filterOpen, setFilterOpen] = useState(null);
  const popoverRef = useRef(null);

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

  // Filter UI helpers
  useEffect(() => {
    // compute available filter values from current workoutHistory
    const keys = ["weight", "sets", "reps", "date"];
    const newAvail = {};
    keys.forEach((k) => {
      newAvail[k] = Array.from(
        new Set(workoutHistory.map((w) => (w[k] !== undefined && w[k] !== null ? String(w[k]) : "")))
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    });
    setAvailableFilters(newAvail);
  }, [workoutHistory]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (filterOpen && popoverRef.current && !popoverRef.current.contains(e.target)) {
        setFilterOpen(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [filterOpen]);

  const toggleFilterOpen = (col) => setFilterOpen((prev) => (prev === col ? null : col));

  const applyFilter = (col, val) => {
    setFilters((prev) => ({ ...prev, [col]: String(val) }));
    setFilterOpen(null);
  };

  const clearFilter = (col) => {
    setFilters((prev) => {
      const copy = { ...prev };
      delete copy[col];
      return copy;
    });
    setFilterOpen(null);
  };

  const visibleHistory = workoutHistory.filter((entry) => {
    for (const [col, val] of Object.entries(filters)) {
      if (!val) continue;
      if (String(entry[col]) !== String(val)) return false;
    }
    return true;
  });

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
            <th className="filter-th" style={{position:'relative'}}>
              Weight (lbs)
              <button
                className="header-filter-btn"
                onClick={() => toggleFilterOpen('weight')}
                title="Filter weight"
              >
                ⚙️
              </button>
              {filterOpen === 'weight' && (
                <div className="filter-popover weight-popover" ref={popoverRef}>
                  {availableFilters.weight.map((v) => (
                    <button
                      key={v}
                      className={`filter-value ${filters.weight === v ? 'selected' : ''}`}
                      onClick={() => applyFilter('weight', v)}
                    >
                      {v}
                    </button>
                  ))}
                  <div className="filter-actions">
                    <button onClick={() => clearFilter('weight')}>Clear</button>
                  </div>
                </div>
              )}
            </th>
            <th className="filter-th" style={{position:'relative'}}>
              Sets
              <button
                className="header-filter-btn"
                onClick={() => toggleFilterOpen('sets')}
                title="Filter sets"
              >
                ⚙️
              </button>
              {filterOpen === 'sets' && (
                <div className="filter-popover" ref={popoverRef}>
                  {availableFilters.sets.map((v) => (
                    <button
                      key={v}
                      className={`filter-value ${filters.sets === v ? 'selected' : ''}`}
                      onClick={() => applyFilter('sets', v)}
                    >
                      {v}
                    </button>
                  ))}
                  <div className="filter-actions">
                    <button onClick={() => clearFilter('sets')}>Clear</button>
                  </div>
                </div>
              )}
            </th>
            <th className="filter-th" style={{position:'relative'}}>
              Reps
              <button
                className="header-filter-btn"
                onClick={() => toggleFilterOpen('reps')}
                title="Filter reps"
              >
                ⚙️
              </button>
              {filterOpen === 'reps' && (
                <div className="filter-popover" ref={popoverRef}>
                  {availableFilters.reps.map((v) => (
                    <button
                      key={v}
                      className={`filter-value ${filters.reps === v ? 'selected' : ''}`}
                      onClick={() => applyFilter('reps', v)}
                    >
                      {v}
                    </button>
                  ))}
                  <div className="filter-actions">
                    <button onClick={() => clearFilter('reps')}>Clear</button>
                  </div>
                </div>
              )}
            </th>
            <th className="filter-th" style={{position:'relative'}}>
              Date
              <button
                className="header-filter-btn"
                onClick={() => toggleFilterOpen('date')}
                title="Filter date"
              >
                ⚙️
              </button>
              {filterOpen === 'date' && (
                <div className="filter-popover" ref={popoverRef}>
                  {availableFilters.date.map((v) => (
                    <button
                      key={v}
                      className={`filter-value ${filters.date === v ? 'selected' : ''}`}
                      onClick={() => applyFilter('date', v)}
                    >
                      {v}
                    </button>
                  ))}
                  <div className="filter-actions">
                    <button onClick={() => clearFilter('date')}>Clear</button>
                  </div>
                </div>
              )}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visibleHistory.map((entry, index) => (
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
