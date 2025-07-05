import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
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
        const exerciseData = exerciseSnapshot.docs.map(
          (doc) => doc.data().name
        );
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
          await addDoc(collection(db, "exercises"), {
            name: exerciseName,
            userId: userId, // Store the userId with each exercise
          });
          setExerciseList((prevList) => [...prevList, exerciseName]);
          setExerciseName("");
        }
      } catch (error) {
        console.error("Error adding exercise: ", error);
      }
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleRowClick = (exercise) => {
    navigate(`/log?exercise=${encodeURIComponent(exercise)}`);
  };

  const handleDelete = async (name) => {
    const confirmDelete = window.confirm("Delete this exercise?");
    if (!confirmDelete) return;

    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const exerciseQuery = query(
        collection(db, "exercises"),
        where("userId", "==", userId),
        where("name", "==", name)
      );

      const snapshot = await getDocs(exerciseQuery);
      snapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "exercises", docSnap.id));
      });

      setExerciseList((prevList) =>
        prevList.filter((exercise) => exercise !== name)
      );
    }
  };

  const filteredExercises = exerciseList.filter((exercise) =>
    exercise.toLowerCase().includes(searchTerm)
  );

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
            <tr key={index}>
              <td
                onClick={() => handleRowClick(exercise)}
                style={{ cursor: "pointer" }}
              >
                {exercise}
              </td>
              <td>
                <button onClick={() => handleDelete(exercise)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExercisePage;
