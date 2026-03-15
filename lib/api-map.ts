export const API = {

  // ================= AUTH =================

  login: "/api/login",
  register: "/api/register",

  // ================= USERS =================

  activateUser: "/api/activate-user",
  pendingStudents: "/api/pending-students",
  pendingTeachers: "/api/pending-teachers",
  students: "/api/students",

  // ================= CLASSES =================

  classes: "/api/classes",
  createClass: "/api/create-class",
  updateClass: "/api/update-class",
  deleteClass: "/api/delete-class",
  classStudents: "/api/class-students",

  // ================= EXERCISES =================

  createExercise: "/api/create-exercise",
  generateExercise: "/api/generate-exercise",
  generateSimilarExercise: "/api/generate-similar-exercise",

  studentExercises: "/api/student-exercises",
  teacherExercises: "/api/get-teacher-exercise",

  classGeneratedExercises: "/api/class-generated-exercises",
  generatedExercises: "/api/generated-exercises",

  // ================= SUBMISSIONS =================

  submitCode: "/api/submit-code",

  studentSubmissions: "/api/student-submissions",
  teacherSubmissions: "/api/teacher-submissions",
  classSubmissions: "/api/class-submissions",

  checkSubmission: "/api/check-submission",

  teacherScore: "/api/teacher-score",

  // ================= AI =================

  analyze: "/api/analyze",
  approveAI: "/api/approve-ai",
  detectCopy: "/api/detect-copy",

  // ================= HISTORY =================

  history: "/api/history",
  classHistory: "/api/class-history",
  codeHistory: "/api/code-history",

  // ================= IMPORT =================

  importStudents: "/api/import-students",

  // ================= DASHBOARD =================

  dashboard: "/api/dashboard"

}