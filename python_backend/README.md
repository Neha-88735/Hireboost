# HireBoost – AI-Powered Interview Preparation Platform

## Architecture & UML Mapping

HireBoost implements an end-to-end AI-powered interview preparation and resume-building ecosystem based on the system UML Class and Object Diagrams.

### Core UML Classes & Operations Implemented:

1. **User**
   - `register()`: User signup, unique ID generation, and automatic profile linkage.
   - `login()`: Email/password and Google OAuth credential flow with fallback.
   - `updateProfile()`: Synchronize personal information and target career preferences.

2. **UserProfile**
   - `updateSkills()`: Dynamically manage candidate competencies used for AI question targeting.
   - `uploadResume()`: Attach and reference candidate resume documents.

3. **InterviewConfig**
   - `configureSession()`: Domain, difficulty (Easy/Medium/Hard), mode (Technical/HR/Mixed), experience level, and duration (up to 30 mins max).

4. **InterviewSession**
   - `startSession()`: Start timer and conversational interview room.
   - `endSession()`: Conclude session, archive conversation, and trigger evaluation.

5. **Transcript**
   - `generateTranscript()`: Comprehensive question and answer transcript with timestamps, notes, and duration metrics. Exportable as PDF and TXT.

6. **EvaluationReport**
   - `evaluate()`: Granular scoring across Technical, Communication, Confidence, and Response Quality with strengths, weaknesses, and recommendations.

7. **ScoreBreakdown**
   - `calculateBreakdown()`: Granular 0–100 scoring breakdown.

8. **ProgressTracker**
   - `trackProgress()`: Longitudinal analytics, score progression, improvement percentage, and "Career Goal Progress" benchmarking.

9. **InterviewHistory**
   - `viewHistory()`: Filterable archive of all historical mock interview attempts.

10. **UserFeedback**
    - Anonymous public community ratings, domain reviews, and candidate suggestions.

11. **Resume**
    - Multi-section interactive resume builder with AI bullet point enhancer and PDF export.

---

## Running the Application

### 1. Live Web Application (Full-Stack React + Express + Gemini AI)
The web application is running live on port 3000:
```bash
npm run dev
```

### 2. Python / Streamlit Application
To run the Streamlit Python implementation:
```bash
cd python_backend
pip install -r requirements.txt
python database.py # Initializes SQLite hireboost.db
streamlit run app.py
```
