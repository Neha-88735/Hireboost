"""
HireBoost - AI-Powered Interview Preparation Platform
Streamlit Main Application
"""
import streamlit as st
import json
import os
from database import init_db, get_connection

st.set_page_config(
    page_title="HireBoost - AI Interview Preparation",
    page_icon="✨",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize Database
init_db()

# Custom Styling
st.markdown("""
<style>
    .main-title { font-size: 2.4rem; font-weight: 800; color: #4f46e5; }
    .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
</style>
""", unsafe_allow_html=True)

# Sidebar Navigation
st.sidebar.title("✨ HireBoost")
st.sidebar.caption("AI Interview Preparation & Resume Builder")

menu = st.sidebar.radio(
    "Navigation",
    [
        "Landing Page",
        "Student Dashboard",
        "Book an Interview",
        "AI Interview Room",
        "Performance Evaluation",
        "Resume Builder",
        "Interview History",
        "Community Reviews",
        "Admin Portal"
    ]
)

if menu == "Landing Page":
    st.markdown("<h1 class='main-title'>Your Career. Your Preparation. Your Success.</h1>", unsafe_allow_html=True)
    st.write("Prepare smarter, practice interviews, improve your skills, and build a resume that gets noticed.")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("Generate Resume", use_container_width=True):
            st.session_state.nav = "Resume Builder"
    with col2:
        if st.button("Book an Interview", use_container_width=True):
            st.session_state.nav = "Book an Interview"

elif menu == "Student Dashboard":
    st.title("Student Dashboard")
    st.subheader("Welcome back, Aditi Aishwarya!")

    col1, col2, col3, col4, col5 = st.columns(5)
    col1.metric("Total Interviews", "4")
    col2.metric("Average Score", "67.3%")
    col3.metric("Best Score", "80%")
    col4.metric("Improvement", "+25%")
    col5.metric("Last Date", "2026-10-27")

    st.markdown("### Your Career Goal Progress")
    st.write("**Target Role:** Software Development Engineer")
    st.progress(0.8)
    st.caption("80% towards target score (Current: 72% | Target: 90%)")

elif menu == "Book an Interview":
    st.title("Interview Configuration & Booking")
    domain = st.selectbox(
        "Domain / Topic",
        ["Data Structures and Algorithms", "Python", "Web Development", "HR Interview", "Custom Topic"]
    )
    difficulty = st.select_slider("Difficulty Level", ["Easy", "Medium", "Hard"], value="Medium")
    duration = st.selectbox("Interview Duration (minutes)", [5, 10, 15, 20, 25, 30], index=2)

    if st.button("Find Available Interviews"):
        st.success(f"Configured: {domain} - {difficulty} - {duration} minutes. Session initialized!")

elif menu == "Resume Builder":
    st.title("Interactive Resume Builder")
    st.write("ATS-friendly Resume with AI Bullet Point Enhancer")
    full_name = st.text_input("Full Name", "Aditi Aishwarya")
    career_obj = st.text_area("Career Objective", "Motivated CS graduate with expertise in algorithms and full-stack engineering.")
    if st.button("Enhance with AI"):
        st.info("AI Suggestion: 'Engineered high-throughput cloud services resulting in 32% reduced latency.'")

st.sidebar.divider()
st.sidebar.info("HireBoost v2.4 • Connected to SQLite & Gemini AI")
