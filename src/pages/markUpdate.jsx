import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./MarkUpdate.css";

const MarkUpdate = () => {
  const location = useLocation();
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedSem, setSelectedSem] = useState("");
  const [numPapers, setNumPapers] = useState(0);
  const [paperNames, setPaperNames] = useState([]);
  const [studentMarks, setStudentMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");

  // ✅ Get admin credentials from session
  const adminUserId = sessionStorage.getItem("adminUserId");
  const adminPassword = sessionStorage.getItem("adminPassword");

  // === Initial load of class/students ===
  useEffect(() => {
    setClassName(location.state?.className || "");
    setStudents(location.state?.students || []);
  }, [location]);

  // === Fetch marks when semester changes ===
  useEffect(() => {
    const fetchSemMarks = async () => {
      if (!selectedSem || students.length === 0) return;

      setLoading(true);
      setError(null);
      setSubmitMessage("");

      try {
        const allMarks = await Promise.all(
          students.map(async (s, idx) => {
            const res = await fetch(
              `http://localhost:5000/student/${encodeURIComponent(
                s.rollNumber
              )}/marks/${encodeURIComponent(selectedSem)}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-id": adminUserId,
                  "x-user-password": adminPassword,
                },
              }
            );

            if (!res.ok) return { idx, marks: [] };
            const data = await res.json();
            return {
              idx,
              marks: Array.isArray(data.marks) ? data.marks : [],
            };
          })
        );

        // Paper names from first student with marks
        const firstWithMarks = allMarks.find((m) => m.marks.length > 0);
        if (firstWithMarks) {
          const fetchedNames = firstWithMarks.marks.map((m) => m.subject || "");
          setPaperNames(fetchedNames);
          setNumPapers(fetchedNames.length);
        } else {
          setPaperNames([]);
          setNumPapers(0);
        }

        // Merge marks into state
        setStudentMarks((prev) => {
          const next = { ...prev };
          allMarks.forEach(({ idx, marks }) => {
            let row = next[idx] ? [...next[idx]] : [];
            marks.forEach((m, i) => {
              row[i] = m.marks != null ? String(m.marks) : "";
            });
            while (row.length < (firstWithMarks ? firstWithMarks.marks.length : 0)) {
              row.push("");
            }
            next[idx] = row;
          });
          return next;
        });

        setSubmitMessage("Existing marks loaded (if any).");
      } catch (err) {
        console.error("fetchSemMarks:", err);
        setError("Failed to fetch semester marks");
      } finally {
        setLoading(false);
      }
    };

    fetchSemMarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSem, students]);

  // === Handlers ===
  const handleSemChange = (e) => {
    setSelectedSem(e.target.value);
    setPaperNames([]);
    setNumPapers(0);
    setStudentMarks({});
    setSubmitMessage("");
    setError(null);
  };

  const handleNumPapersChange = (e) => {
    const count = parseInt(e.target.value, 10) || 0;
    setNumPapers(count);

    // Resize paperNames
    setPaperNames((prev) => {
      const next = [...prev];
      while (next.length < count) next.push("");
      return next.slice(0, count);
    });

    // Resize marks for students (keep existing)
    setStudentMarks((prev) => {
      const updated = {};
      students.forEach((_, idx) => {
        const current = prev[idx] ? [...prev[idx]] : [];
        while (current.length < count) current.push("");
        updated[idx] = current.slice(0, count);
      });
      return updated;
    });
  };

  const handlePaperNameChange = (i, v) => {
    setPaperNames((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  const handleMarksChange = (roll, paperIndex, value) => {
    setStudentMarks((prev) => {
      const idx = students.findIndex((s) => s.rollNumber === roll);
      if (idx === -1) return prev;
      const current = prev[idx] ? [...prev[idx]] : Array(numPapers).fill("");
      current[paperIndex] = value;
      return { ...prev, [idx]: current };
    });
  };

  // === Submit marks ===
  const handleSubmit = async () => {
    if (!selectedSem || numPapers === 0 || paperNames.some((n) => n.trim() === "")) {
      alert("Select semester and fill all paper names");
      return;
    }
    setLoading(true);
    setError(null);
    setSubmitMessage("");

    try {
      const requests = students.map((s, idx) => {
        const marksForStudent = studentMarks[idx] || Array(numPapers).fill("");
        const subjects = paperNames.map((p, i) => ({
          subject: p,
          marks: marksForStudent[i] ?? "",
        }));

        return fetch(
          `http://localhost:5000/student/${encodeURIComponent(
            s.rollNumber
          )}/marks/${encodeURIComponent(selectedSem)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": adminUserId,
              "x-user-password": adminPassword,
            },
            body: JSON.stringify({ subjects }),
          }
        ).then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw { roll: s.rollNumber, error: err.error || res.status };
          }
          return res.json();
        });
      });

      const result = await Promise.allSettled(requests);
      const failed = result
        .filter((r) => r.status === "rejected")
        .map((r) => r.reason);

      if (failed.length) {
        setError(`Failed for: ${failed.map((f) => f.roll).join(", ")}`);
        setSubmitMessage("Some updates failed");
      } else {
        setSubmitMessage("All marks updated successfully!");
      }
    } catch (err) {
      setError(err.message || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  // === JSX ===
  return (
    <div className="mark-page">
      <div className="mark-card-container">
      <div className="mark-card">
        <h2>Mark Update – {className}</h2>

        <label>Semester:</label>
        <select value={selectedSem} onChange={handleSemChange}>
          <option value="">--Select--</option>
          {["sem1", "sem2", "sem3", "sem4", "sem5", "sem6"].map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>

        {selectedSem && (
          <>
            <label>No. of Papers:</label>
            <input
              type="number"
              value={numPapers}
              onChange={handleNumPapersChange}
            />
          </>
        )}

        {numPapers > 0 && (
          <>
            <h3>Papers</h3>
            {paperNames.map((n, i) => (
              <div key={i}>
                <label>Paper {i + 1}:</label>
                <input
                  value={n}
                  onChange={(e) => handlePaperNameChange(i, e.target.value)}
                />
              </div>
            ))}
          </>
        )}

        {students.length > 0 &&
          numPapers > 0 &&
          paperNames.every((n) => n.trim() !== "") && (
            <>
              <h3>Marks</h3>
              {students.map((s, idx) => (
                <div key={s.rollNumber} className="student-block">
                  <strong>
                    {s.name} ({s.rollNumber})
                  </strong>
                  {paperNames.map((p, i) => (
                    <div key={i}>
                      <label>{p}:</label>
                      <input
                        type="number"
                        value={studentMarks[idx]?.[i] ?? ""}
                        onChange={(e) =>
                          handleMarksChange(s.rollNumber, i, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

        {error && <p className="error-msg">{error}</p>}
        {submitMessage && <p className="success-msg">{submitMessage}</p>}

        <button
          className="btn-main"
          disabled={
            loading ||
            !selectedSem ||
            numPapers === 0 ||
            paperNames.some((n) => n.trim() === "")
          }
          onClick={handleSubmit}
        >
          {loading ? "Saving..." : "Submit All Marks"}
        </button>
      </div>
      </div>
    </div>
  );
};

export default MarkUpdate;
