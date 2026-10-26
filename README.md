# TechFusion — Brand Trust, Before Publish
> **An Intelligent Brand-Governance Platform**  
> *Round 2 Submission — Problem Statement by Inkloom AI*

---

## 👥 Team TechFusion
- **Yash Singla** — Team Leader · Product Vision, System Architecture & Integration
- **Rishit Negi** — Review-Engine Logic · Heuristic Tokenizer & Flesch NLP Analyzer
- **Ramandeep Singh** — Platform & Workflow · Role-Based Approvals, Audit Logging & PDF Engine
- **Aditya Sharma** — UX, Testing & Demo Readiness · UI Design, Charts & Validation

---

## 🚀 Live Working Demo & Quick Start

### 1. Installation
Clone repository and install dependencies:
```bash
cd techfusion
python -m pip install -r requirements.txt
```

### 2. Run Application Locally
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# or simply:
python run_server.py
```
Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser.

### 3. Deploy on Render
This repository includes a `render.yaml` blueprint and dynamic port binding:
1. Go to **[Render Dashboard](https://dashboard.render.com/)** -> **New** -> **Web Service**.
2. Connect your GitHub repository: `https://github.com/furydarkknight/techfusion-brand-governance.git`.
3. Configure the settings:
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Click **Deploy Web Service**.

---

## 📋 What We Have Submitted (Round 2 Deliverables)

1. **Working Project Link:** **[https://techfusion-brand-governance.onrender.com](https://techfusion-brand-governance.onrender.com)**  
   *(Note: Since this is hosted on Render's free tier, the first request may take approximately 50 seconds to wake up from idle sleep).*  
   *(Local mirror: [http://127.0.0.1:8000](http://127.0.0.1:8000))*
2. **Source-Code Repository:** **[https://github.com/furydarkknight/techfusion-brand-governance.git](https://github.com/furydarkknight/techfusion-brand-governance.git)**
3. **Updated Project PDF:** Available in the repo as `TechFusion_Round2_Submission_Report.pdf` (or via one-click download directly inside the live app navigation bar)
4. **List of Completed Features:** (See Section Below)
5. **Technology and Implementation Details:** Decoupled FastAPI backend, Deterministic Guardrail Engine v2.4, Tailwind CSS, Chart.js, ReportLab PDF Generator.
6. **Explanation of Changes Made to Original Plan:** (See Section Below)
7. **Three Major Improvements for Round 3:** (Substantial additions detailed below)

---

## 🎯 Completed Features in Round 2

| Module | Capability | Status |
| :--- | :--- | :--- |
| **Live Review Studio** | Real-time multi-category audit across Tone, Terminology, Facts, Visuals, and WCAG Accessibility. | **100% Operational** |
| **Guideline Hub** | Versioned brand rules repository with custom rule creation and categorization. | **100% Operational** |
| **Verified Facts DB** | Audited fact repository linking claims (customer counts, SLAs, certifications) to evidence documents. | **100% Operational** |
| **Purpose-Aware Diff** | Side-by-side diff generator preserving creator's original intent with 1-click apply. | **100% Operational** |
| **Editorial & Approvals** | Multi-role workflow (Creator, Manager, Reviewer) with threaded feedback and sign-off. | **100% Operational** |
| **Governance Override** | Auditable exception workflow requiring formal business justification. | **100% Operational** |
| **Governance Insights** | Recurring error charts (Chart.js), department compliance heatmaps, drift alerts. | **100% Operational** |
| **Certificate & PDF Export**| One-click export of formal Brand Audit Certificates and Round 2 Submission Reports. | **100% Operational** |

---

## 🛠️ Architecture & Technical Decisions

```
+--------------------------------------------------------------+
|                   TechFusion Client (SPA)                    |
|    Tailwind CSS · Phosphor Icons · Chart.js · Responsive UI  |
+------------------------------+-------------------------------+
                               | JSON REST APIs
                               v
+--------------------------------------------------------------+
|                    FastAPI Application Layer                 |
|       Routing · CORS · Validation · Static File Serving      |
+------------------------------+-------------------------------+
                               |
         +---------------------+---------------------+
         |                                           |
         v                                           v
+-----------------------------+             +-------------------------------+
|    Governance Engine v2.4   |             |   Database & Knowledge Layer  |
| - Lexical Regex Tokenizer   |             | - Versioned Guidelines DB     |
| - Fact Matching Heuristics  |             | - Audited Claims Repository   |
| - Flesch Readability NLP    |             | - Revision & Audit Log        |
| - Purpose-Preserving Diff   |             | - Workflow & Comments Store   |
+-----------------------------+             +-------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|                  ReportLab PDF Export Engine                 |
| - Official Round 2 Submission Document Generation            |
| - Tamper-Evident Brand Audit Certificate Generation          |
+--------------------------------------------------------------+
```

### Key Technical Decisions
1. **Explainable Deterministic Engine over Unbounded LLM Calls:**  
   Rather than relying solely on non-deterministic cloud generative models that can hallucinate and leak confidential copy, TechFusion utilizes a deterministic, sub-15ms guardrail engine.
2. **Explicit Evidence Linking:**  
   Every single flagged issue links to a precise guideline rule ID (`GL-CLAIM-01`) or verified fact record (`FACT-01`) with source citation (`SEC-Q4-2025-Metrics.pdf`).
3. **Purpose-Aware Preserved Rewriting:**  
   Instead of blanket rejection or rewriting the entire piece into generic marketing copy, our engine surgically replaces only non-compliant phrases while preserving author tone and argument.

---

## 🔄 Explanation of Changes Made from Round 1 Plan

1. **Interactive Visual Diff instead of Static Warnings:**  
   In Round 1, we proposed simple warning banners. Testing showed creators find warnings tedious. We upgraded the studio to generate an interactive side-by-side proposal with 1-click "Apply All" or individual item replacements.
2. **Mandatory Governance Override Justification:**  
   Recognizing that enterprise marketing teams occasionally run authorized exceptions, we introduced a formal "Governance Override" feature that mandates an auditable business reason.
3. **Local In-Memory Sub-15ms Guardrail:**  
   Protected confidential brand materials by ensuring text analysis happens locally without routing to third-party endpoints.

---

## 🌟 Three Major Improvements Planned for Round 3 (The Finish)

The following three additions will be implemented for Round 3:

1. **Multi-Modal Computer Vision Brand Inspector:**  
   Automated visual governance for marketing banners, infographics, slide decks, and PDF documents. Utilizes OCR, logo safe-zone measurement, brand font hierarchy verification, and WCAG 2.1 AA foreground-to-background contrast ratio calculation directly on uploaded image files (PNG/JPEG/SVG/PDF).
2. **Vector-Grounded Semantic RAG & Dynamic Brand Guidelines Ingestion:**  
   Integration of ChromaDB/FAISS vector retrieval pipeline allowing enterprise admins to upload unstructured PDF brand books, annual SEC 10-K filings, and press releases. The system chunks and indexes verified facts and tone rules with semantic similarity search, providing context-aware explanations for nuanced industry jargon.
3. **Real-Time CMS & Browser Extensions (Figma, Google Docs, Chrome):**  
   Inline checking extensions for Google Docs, WordPress, and Figma. Creators will receive non-intrusive brand guardrail prompts while drafting directly inside their native design and authoring tools, eliminating the friction of manual copy-pasting.

---

## ⏱️ 60-Second Judges' Evaluation Walkthrough

1. Open **[https://techfusion-brand-governance.onrender.com](https://techfusion-brand-governance.onrender.com)** *(Note: Render free tier takes ~50 seconds to boot on first request)* or local **[http://127.0.0.1:8000](http://127.0.0.1:8000)**.
2. In the **Live Review Studio**, click **"Risky Launch Copy (8 Issues)"** demo preset.
3. Click **"Run Brand Audit"**. Inspect the score drop to **42/100**, with 8 issues flagged across claims, tone, and terminology.
4. Click **"Apply All Suggestions"** and re-run audit. Watch score soar to **98/100**.
5. Switch role to **Reviewer / Legal** in the top bar. Go to **Editorial & Approvals**, add a sign-off comment, and click **"Approve for Publication"**.
6. Click **"Submission PDF"** in the top navbar to download the official Round 2 submission document.
