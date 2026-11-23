import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'hireboost.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. User
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        role TEXT NOT NULL,
        join_date TEXT NOT NULL
    )
    ''')

    # 2. UserProfile
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_profiles (
        profile_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        skills TEXT,
        experience TEXT,
        target_role TEXT,
        resume_url TEXT,
        resume_name TEXT,
        FOREIGN KEY (user_id) REFERENCES users (user_id)
    )
    ''')

    # 3. InterviewConfig
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS interview_configs (
        config_id TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        custom_topic TEXT,
        difficulty TEXT NOT NULL,
        mode TEXT NOT NULL,
        experience_level TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        question_set_type TEXT NOT NULL,
        title TEXT,
        description TEXT
    )
    ''')

    # 4. InterviewSession
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS interview_sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        config_id TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        duration_seconds INTEGER,
        current_question_index INTEGER,
        questions_json TEXT,
        answers_json TEXT,
        transcript_id TEXT,
        evaluation_report_id TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (config_id) REFERENCES interview_configs (config_id)
    )
    ''')

    # 5. Transcript
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transcripts (
        transcript_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        conversation_json TEXT NOT NULL,
        duration INTEGER,
        language TEXT DEFAULT 'English',
        generated_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES interview_sessions (session_id)
    )
    ''')

    # 6. EvaluationReport
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS evaluation_reports (
        report_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        technical_score INTEGER,
        communication_score INTEGER,
        confidence_score INTEGER,
        response_quality_score INTEGER,
        overall_score INTEGER,
        written_feedback TEXT,
        strengths_json TEXT,
        weaknesses_json TEXT,
        suggestions_json TEXT,
        evaluated_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES interview_sessions (session_id)
    )
    ''')

    # 7. ScoreBreakdown
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS score_breakdowns (
        breakdown_id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL,
        technical_score INTEGER,
        communication_score INTEGER,
        confidence_score INTEGER,
        response_quality_score INTEGER,
        FOREIGN KEY (report_id) REFERENCES evaluation_reports (report_id)
    )
    ''')

    # 8. ProgressTracker
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS progress_trackers (
        tracker_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        total_interviews INTEGER DEFAULT 0,
        avg_score REAL DEFAULT 0,
        highest_score INTEGER DEFAULT 0,
        latest_score INTEGER DEFAULT 0,
        improvement_percentage REAL DEFAULT 0,
        last_updated TEXT,
        FOREIGN KEY (user_id) REFERENCES users (user_id)
    )
    ''')

    # 9. UserFeedback
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_feedback (
        feedback_id TEXT PRIMARY KEY,
        session_id TEXT,
        user_id TEXT,
        user_name TEXT,
        interview_topic TEXT,
        domain TEXT,
        overall_rating INTEGER,
        difficulty_rating INTEGER,
        question_quality_rating INTEGER,
        interview_experience_rating INTEGER,
        written_feedback TEXT,
        suggestions TEXT,
        created_at TEXT NOT NULL,
        is_public INTEGER DEFAULT 1
    )
    ''')

    # 10. Predefined Question Bank
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS interview_questions (
        question_id TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        mode TEXT NOT NULL,
        question_text TEXT NOT NULL,
        sample_answer TEXT,
        key_points_json TEXT
    )
    ''')

    # Seed Initial Demo User & Initial Questions if empty
    cursor.execute('SELECT COUNT(*) as count FROM users')
    if cursor.fetchone()['count'] == 0:
        student_id = 'usr_student_001'
        cursor.execute('''
        INSERT INTO users (user_id, name, email, password_hash, role, join_date)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (student_id, 'Aditi Aishwarya', 'aditiaishwarya003@gmail.com', 'hashed_pass_demo', 'Student', '2026-09-15'))

        cursor.execute('''
        INSERT INTO user_profiles (profile_id, user_id, skills, experience, target_role, resume_url, resume_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', ('prof_001', student_id, json.dumps(['Python', 'Data Structures', 'React', 'SQL']), 'Fresher', 'Software Development Engineer', 'https://example.com/aditi_cv.pdf', 'Aditi_Resume.pdf'))

        cursor.execute('''
        INSERT INTO progress_trackers (tracker_id, user_id, total_interviews, avg_score, highest_score, latest_score, improvement_percentage, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', ('trck_001', student_id, 4, 67.25, 80, 80, 25.0, datetime.now().isoformat()))

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("HireBoost SQLite database initialized successfully.")
