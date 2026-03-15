# Interview Mate — Evaluation Methodology

## Philosophy

Our evaluation system mirrors how real human interviewers assess candidates: not just checking answers, but analyzing **depth of understanding, communication clarity, and problem-solving approach** — powered by AI.

---

## 1. Interview Evaluation (Behavioral + Technical)

### Scoring Dimensions (Each 1-10)

| Dimension | What It Measures |
|---|---|
| **Technical Depth** | Understanding of core concepts, ability to explain underlying mechanisms |
| **Relevance** | How well the answer addresses the specific question asked |
| **Clarity** | Communication quality, structure, and articulation |
| **Completeness** | Coverage of edge cases, trade-offs, and related topics |
| **Overall** | Holistic assessment combining all factors |

### How It Works
1. AI receives the **question**, **expected topics**, **difficulty level**, and **candidate's answer**
2. Evaluates like a **Senior Tech Lead** — strict, logical, specific
3. Provides first-person conversational feedback (e.g., *"I liked your point about X, but you missed Y"*)
4. Scores are aggregated into a **Skill Radar** visualization across categories

### Progressive Difficulty Engine
```
Level 1 (Introductory) → Score > 6 → Level 2 (Intermediate)
Level 2 (Intermediate) → Score > 7 → Level 3 (Advanced)
Level 3 (Advanced)     → Score > 8 → Level 4 (Expert)
```
- Questions **adapt in real-time** based on candidate performance
- Poor answers trigger **follow-up probes** at the same difficulty
- Strong answers **escalate complexity** progressively

---

## 2. Coding Evaluation

### Analysis Dimensions

| Metric | Description |
|---|---|
| **Correctness** | Does the solution produce the right output? |
| **Time Complexity** | Big O notation analysis (e.g., O(n), O(n log n)) |
| **Space Complexity** | Memory usage analysis |
| **Optimal Check** | Is this the best possible approach? |
| **Code Quality** | Readability (1-10), Efficiency (1-10), Edge Cases (1-10) |

### Feedback Behavior
- ✅ **Optimal solution** → Congratulations message + green score card
- ⚠️ **Suboptimal but correct** → Explains the better approach + improvement tips
- ❌ **Incorrect** → Lists specific bugs + suggests fix strategy

### Anti-Cheating Measures
| Measure | Implementation |
|---|---|
| **Tab Switch Detection** | `visibilitychange` API — 3 strikes = session terminated |
| **Video Proctoring** | Live webcam feed with `PROCTORED` indicator |
| **Session Integrity** | Code + session state locked on termination |

---

## 3. Resume-Based Personalization

### Pipeline
```
PDF Upload → Text Extraction → AI Analysis → Skill Extraction
→ Role Detection → Experience Level → Personalized Questions
```

The AI extracts:
- **Name** and **Role** (e.g., "Frontend Developer")
- **Experience Level** (e.g., "3 years", "Senior")
- **Up to 15 key skills** — used to generate relevant interview questions

This ensures every candidate gets questions tailored to **their actual background**, not generic templates.

---

## 4. Aggregate Scoring Model

### Final Score Computation
```
Final Score = Weighted Average of:
  - Technical Depth × 0.30
  - Relevance      × 0.20
  - Clarity         × 0.20
  - Completeness    × 0.15
  - Coding Score    × 0.15
```

### Result Classification
| Score Range | Result | Color |
|---|---|---|
| 8.0 – 10.0 | 🟢 **Strong Hire** | Green |
| 6.0 – 7.9 | 🟡 **Potential Hire** | Amber |
| 4.0 – 5.9 | 🟠 **Needs Improvement** | Orange |
| 1.0 – 3.9 | 🔴 **Not Recommended** | Red |

---

## 5. Enterprise Reporting

Admins can view:
- **Per-candidate detailed reports** with question-by-question breakdown
- **Skill radar charts** showing strengths/weaknesses across categories
- **Comparative analytics** for batch hiring decisions
- **Exportable data** for ATS integration
