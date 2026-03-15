# AI CODE MENTOR – SYSTEM ARCHITECTURE

---

# 1. DATABASE STRUCTURE

## users

| column | type | description |
|------|------|-------------|
| id | uuid | user id |
| name | text | tên |
| email | text | email |
| password | text | mật khẩu |
| role | text | student / teacher / admin |
| class_id | uuid | lớp học |
| status | text | pending / active |
| created_at | timestamp | ngày tạo |

---

## classes

| column | type |
|------|------|
| id | uuid |
| name | text |
| teacher_id | uuid |
| created_at | timestamp |

---

## submissions

| column | type |
|------|------|
| id | uuid |
| student_id | uuid |
| class_id | uuid |
| code | text |
| ai_feedback | text |
| teacher_score | int |
| status | text |
| language | text |
| created_at | timestamp |

---

## generated_exercises

| column | type |
|------|------|
| id | uuid |
| student_id | uuid |
| class_id | uuid |
| exercise | text |
| created_at | timestamp |

---

## code_history

| column | type |
|------|------|
| id | uuid |
| code | text |
| language | text |
| ai_feedback | text |
| student_id | uuid |
| class_id | uuid |
| created_at | timestamp |

---

# 2. API LIST

## Authentication

/api/login  
/api/register  

---

## Users

/api/activate-user  
/api/pending-students  
/api/pending-teachers  
/api/students  

---

## Classes

/api/classes  
/api/create-class  
/api/update-class  
/api/delete-class  
/api/class-students  

---

## Exercises

/api/create-exercise  
/api/generate-exercise  
/api/generate-similar-exercise  
/api/student-exercises  
/api/get-teacher-exercise  
/api/class-generated-exercises  
/api/generated-exercises  

---

## Submissions

/api/submit-code  
/api/student-submissions  
/api/teacher-submissions  
/api/class-submissions  
/api/check-submission  
/api/teacher-score  

---

## AI

/api/analyze  
/api/approve-ai  
/api/detect-copy  

---

## History

/api/history  
/api/class-history  
/api/code-history  

---

## Dashboard

/api/dashboard  

---

# 3. STUDENT FLOW

Student register  
↓  
Teacher activate account  
↓  
Student login  
↓  
Fetch exercises  
↓  
Write code  
↓  
AI analyze code  
↓  
Submit code  
↓  
Teacher score  

---

# 4. TEACHER FLOW

Create class  
↓  
Import students  
↓  
Activate students  
↓  
Create exercises  
↓  
View submissions  
↓  
Score submissions  
↓  
Detect copy  
↓  
View statistics  

---

# 5. AI FLOW

Student code  
↓  
/api/analyze  
↓  
AI feedback  
↓  
store code_history  
↓  
store submissions  

---

# 6. COPY DETECTION FLOW

Teacher click detect copy  
↓  
/api/detect-copy  
↓  
compare submissions  
↓  
return similarity %

---

# 7. PROJECT STRUCTURE

app  
 ├─ api  
 ├─ teacher  
 ├─ student  

lib  
 ├─ supabase.ts  
 ├─ api-map.ts  
 ├─ db-tables.ts  
 └─ system-architecture.md  

---

# 8. CORE FEATURES

## Teacher

- manage classes
- import students
- activate accounts
- create exercises
- view submissions
- score submissions
- detect copy
- dashboard statistics

## Student

- register
- login
- view exercises
- write code
- receive AI feedback
- submit code

## AI

- analyze code
- generate exercises
- detect similar code
