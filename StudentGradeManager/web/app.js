/*
 * Student Grade Manager
 * Main data structure: an array of student objects.
 * localStorage persists the array between browser sessions.
 */

const STORAGE_KEY = "studentGradeManager.students.v1";
const PASS_MARK = 50;

const sampleStudents = [
  { id: "UCC2026001", name: "Ama Mensah", score: 86 },
  { id: "UCC2026002", name: "Kwame Asare", score: 74 },
  { id: "UCC2026003", name: "Akosua Boateng", score: 68 },
  { id: "UCC2026004", name: "Kofi Owusu", score: 53 },
  { id: "UCC2026005", name: "Abena Osei", score: 42 }
];

let students = loadStudents(); // ARRAY: the main collection of records
let editingId = null;
let toastTimer = null;

const form = document.getElementById("studentForm");
const nameInput = document.getElementById("studentName");
const idInput = document.getElementById("studentId");
const scoreInput = document.getElementById("studentScore");
const formMessage = document.getElementById("formMessage");
const tableBody = document.getElementById("studentTableBody");
const searchInput = document.getElementById("searchInput");

function loadStudents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Could not read saved student records:", error);
  }
  // First launch: seed the app with example records.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleStudents));
  return sampleStudents.map(student => ({ ...student }));
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function localGrade(score) {
  // The Java API is authoritative when available; this fallback keeps the
  // interface usable if the API is temporarily unavailable.
  if (score >= 80) return "A";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "C";
  if (score >= 60) return "C+";
  if (score >= 50) return "D";
  return "F";
}

async function getGrade(score) {
  try {
    const response = await fetch(`/api/grade?score=${encodeURIComponent(score)}`);
    if (!response.ok) throw new Error("Grade API returned an error");
    const result = await response.json();
    return result.grade;
  } catch (error) {
    return localGrade(score);
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();
}

function showMessage(message, isError = true) {
  formMessage.textContent = message;
  formMessage.style.color = isError ? "#c53c4c" : "#17865b";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function resetForm() {
  form.reset();
  editingId = null;
  document.getElementById("formTitle").textContent = "Add a student";
  document.getElementById("submitBtn").textContent = "＋ Add Student";
  document.getElementById("cancelEditBtn").classList.add("hidden");
  showMessage("");
}

function validateStudent(name, id, score) {
  if (!name.trim()) return "Enter the student's full name.";
  if (name.trim().length < 2) return "Name must contain at least 2 characters.";
  if (!id.trim()) return "Enter a student ID.";
  if (!/^[a-zA-Z0-9_-]+$/.test(id.trim())) return "Student ID may contain only letters, numbers, hyphens, and underscores.";
  if (score === "" || !Number.isInteger(Number(score))) return "Enter a whole-number score.";
  if (Number(score) < 0 || Number(score) > 100) return "Score must be between 0 and 100.";
  const duplicate = students.some(student =>
    student.id.toLowerCase() === id.trim().toLowerCase() && student.id !== editingId
  );
  if (duplicate) return "That student ID already exists. Use a unique ID.";
  return "";
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const name = nameInput.value.trim();
  const id = idInput.value.trim();
  const score = Number(scoreInput.value);
  const error = validateStudent(name, id, score);
  if (error) {
    showMessage(error);
    return;
  }

  // Ask the Java backend to calculate the grade, then store the record.
  const grade = await getGrade(score);
  if (editingId) {
    const index = students.findIndex(student => student.id === editingId);
    if (index !== -1) students[index] = { id, name, score, grade };
    showToast("Student record updated.");
  } else {
    students.push({ id, name, score, grade }); // ARRAY operation: append
    showToast("Student added successfully.");
  }
  saveStudents();
  resetForm();
  render();
});

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = students.filter(student =>
    student.name.toLowerCase().includes(query) ||
    student.id.toLowerCase().includes(query)
  ); // ARRAY operation: filter

  tableBody.innerHTML = "";
  document.getElementById("emptyState").style.display = filtered.length ? "none" : "block";

  filtered.forEach(student => {
    const grade = student.grade || localGrade(Number(student.score));
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><div class="student-cell"><div class="avatar">${escapeHTML(initials(student.name))}</div><span class="student-name">${escapeHTML(student.name)}</span></div></td>
      <td>${escapeHTML(student.id)}</td>
      <td class="score">${Number(student.score)}%</td>
      <td><span class="grade grade-${grade}">${grade}</span></td>
      <td><span class="result-status ${Number(student.score) < PASS_MARK ? "fail" : ""}">${Number(student.score) < PASS_MARK ? "Needs support" : "Pass"}</span></td>
      <td><div class="row-actions"><button class="small-action" data-action="edit" data-id="${escapeHTML(student.id)}">Edit</button><button class="small-action delete" data-action="delete" data-id="${escapeHTML(student.id)}">Delete</button></div></td>`;
    tableBody.appendChild(tr);
  });

  const scores = students.map(student => Number(student.score)); // ARRAY operation: map
  const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  const highest = students.length ? students.reduce((best, student) => Number(student.score) > Number(best.score) ? student : best) : null;
  const passed = students.filter(student => Number(student.score) >= PASS_MARK).length;

  document.getElementById("totalCount").textContent = students.length;
  document.getElementById("averageScore").textContent = `${average.toFixed(1)}%`;
  document.getElementById("highestScore").textContent = highest ? `${highest.score}%` : "—";
  document.getElementById("highestName").textContent = highest ? highest.name : "No records yet";
  document.getElementById("passRate").textContent = `${students.length ? Math.round(passed / students.length * 100) : 0}%`;
  document.getElementById("tableCount").textContent = filtered.length;
  document.getElementById("footerSummary").textContent = `Showing ${filtered.length} of ${students.length} student${students.length === 1 ? "" : "s"}`;
}

tableBody.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const student = students.find(item => item.id === button.dataset.id);
  if (!student) return;

  if (button.dataset.action === "edit") {
    editingId = student.id;
    nameInput.value = student.name;
    idInput.value = student.id;
    scoreInput.value = student.score;
    document.getElementById("formTitle").textContent = "Edit student";
    document.getElementById("submitBtn").textContent = "Save Changes";
    document.getElementById("cancelEditBtn").classList.remove("hidden");
    showMessage("Update the fields and select Save Changes.", false);
    nameInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (button.dataset.action === "delete") {
    if (!window.confirm(`Delete the record for ${student.name}?`)) return;
    students = students.filter(item => item.id !== student.id); // ARRAY operation: remove
    saveStudents();
    if (editingId === student.id) resetForm();
    render();
    showToast("Student record deleted.");
  }
});

searchInput.addEventListener("input", render);
document.getElementById("cancelEditBtn").addEventListener("click", resetForm);

document.getElementById("sampleBtn").addEventListener("click", () => {
  if (students.length && !window.confirm("Replace the current records with the five sample students?")) return;
  students = sampleStudents.map(student => ({ ...student }));
  saveStudents();
  resetForm();
  searchInput.value = "";
  render();
  showToast("Sample data loaded.");
});

// Fill in Java-calculated grades for sample/existing records on startup.
(async function initializeGrades() {
  for (const student of students) {
    if (!student.grade) student.grade = await getGrade(Number(student.score));
  }
  saveStudents();
  render();
})();

render();
