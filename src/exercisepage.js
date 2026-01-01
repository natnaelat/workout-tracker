import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  writeBatch,
  doc as firestoreDoc,
} from "firebase/firestore"; // Import Firestore functions
import { auth, db } from "./firebase"; // Correct path
import "./exercisepage.css";

const ExercisePage = () => {
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseList, setExerciseList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Fetch exercises from Firestore when the component mounts
  useEffect(() => {
    const fetchExercises = async () => {
      if (auth.currentUser) {
        const userId = auth.currentUser.uid; // Get current user ID
        const exerciseCollection = collection(db, "exercises");
        const exerciseQuery = query(
          exerciseCollection,
          where("userId", "==", userId) // Only fetch exercises for the current user
        );
        const exerciseSnapshot = await getDocs(exerciseQuery);
        const exerciseData = exerciseSnapshot.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
        }));
        setExerciseList(exerciseData);
      }
    };
    fetchExercises();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (exerciseName.trim()) {
      try {
        if (auth.currentUser) {
          const userId = auth.currentUser.uid;
          const newRef = await addDoc(collection(db, "exercises"), {
            name: exerciseName,
            userId: userId, // Store the userId with each exercise
          });
          setExerciseList((prevList) => [
            ...prevList,
            { id: newRef.id, name: exerciseName },
          ]);
          setExerciseName("");
        }
      } catch (error) {
        console.error("Error adding exercise: ", error);
      }
    }
  };

  const handleDeleteExercise = async (exerciseId, exerciseName) => {
    if (!auth.currentUser) return;
    const confirmed = window.confirm(
      `Delete exercise "${exerciseName}" and all associated workouts?`
    );
    if (!confirmed) return;
    try {
      const userId = auth.currentUser.uid;
      const batch = writeBatch(db);

      // Delete workouts tied to this exercise for the current user
      const workoutsQuery = query(
        collection(db, "workouts"),
        where("userId", "==", userId),
        where("exerciseName", "==", exerciseName)
      );
      const workoutsSnap = await getDocs(workoutsQuery);
      workoutsSnap.forEach((w) => {
        batch.delete(firestoreDoc(db, "workouts", w.id));
      });

      // Delete the exercise document
      batch.delete(firestoreDoc(db, "exercises", exerciseId));

      await batch.commit();

      // Update local UI
      setExerciseList((prev) => prev.filter((e) => e.id !== exerciseId));
    } catch (error) {
      console.error("Error deleting exercise and workouts:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleRowClick = (exercise) => {
    navigate(`/log?exercise=${encodeURIComponent(exercise)}`);
  };

  const filteredExercises = exerciseList.filter((exercise) => {
    const name = typeof exercise === "string" ? exercise : exercise.name || "";
    return name.toLowerCase().includes(searchTerm);
  });

  return (
    <div className="exercise-page">
      <h1>Exercise Manager</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="exercise">Add Exercise</label>
        <input
          type="text"
          id="exercise"
          name="exercise"
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          required
        />
        <button type="submit">Add Exercise</button>
      </form>

      <input
        type="text"
        id="searchBar"
        placeholder="Search exercises..."
        value={searchTerm}
        onChange={handleSearch}
      />

      <h2>Exercise List</h2>

      <table>
        <thead>
          <tr>
            <th>Exercise Name</th>
          </tr>
        </thead>
        <tbody>
          {filteredExercises.map((exercise, index) => (
            <tr key={exercise.id || index}>
              <td className="exercise-cell">
                <span
                  className="exercise-name"
                  onClick={() => handleRowClick(exercise.name)}
                >
                  {exercise.name}
                </span>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteExercise(exercise.id, exercise.name);
                  }}
                  onMouseEnter={(e) => {
                    const tr = e.currentTarget.closest("tr");
                    if (tr) tr.classList.add("no-row-hover");
                  }}
                  onMouseLeave={(e) => {
                    const tr = e.currentTarget.closest("tr");
                    if (tr) tr.classList.remove("no-row-hover");
                  }}
                  title={`Delete ${exercise.name}`}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExercisePage;
