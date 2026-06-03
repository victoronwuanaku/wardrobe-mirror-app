# Wardrobe Mirror — Sharpened Overview: Privacy & Architecture

### 1. Legal & Regulatory Assessment: Critiques & Blind Spots

While the initial assessment accurately identifies the low-risk nature of the data, its legal strategy has two significant blind spots that could complicate the research:

* **The "Consent" Trap (Article 6 vs. Public Task):** The document recommends Article 6(1)(a) "Consent" as the legal basis. **The Blind Spot:** In academic research, relying on Consent means participants retain the absolute Right to Erasure (they can withdraw consent at any time). If multiple participants demand their data be deleted midway through data analysis, the dataset's integrity is compromised.
    * **Better Approach:** For university-backed research in the Netherlands, **Article 6(1)(e) "Public Task"** is often the safer, preferred legal basis. It provides a more stable foundation for retaining research data while still requiring ethical transparency.
* **Pseudonymous vs. Truly Anonymous:** The document classifies the session ID as pseudonymous because it "cannot be linked back to a person without additional information the researcher does not hold". **The Blind Spot:** Under GDPR Recital 26, if *nobody* (not the researcher, not the platform) possesses a key to link that ID to a natural person, the data may legally cross the threshold into being **fully anonymous**. If it is truly anonymous, GDPR does not apply at all, instantly removing much of the regulatory burden.

---

### 2. Technical Architecture & Incident Analysis

The breakdown of the Google Apps Script failure is accurate, but the underlying technical critique requires a sharper focus on system design flaws:

* **Mimicking Malicious Infrastructure:** The core technical failure was deploying an unauthenticated, public POST endpoint on a free consumer Google account. To automated security scanners, a script silently ingesting user data from random IP addresses into a private spreadsheet looks functionally identical to a credential-harvesting phishing kit. Google's ban was an inevitable Terms of Service enforcement, not a privacy breach.
* **Zero System Resilience:** The architecture lacked any fail-safes. Because the browser sent data directly to a single Google endpoint, the moment that endpoint was flagged and disabled, all incoming data was lost. There was no local browser caching (e.g., `localStorage`) or queuing system to temporarily hold data if the server connection failed.
* **Data Integrity Risks:** Because the endpoint lacked authentication, anyone with the URL could POST arbitrary data. A malicious bot could have flooded the spreadsheet with thousands of fake survey responses, quietly ruining the academic study.

---

### 3. Expanding the Strategic Recommendations

#### A. The Best-Case Scenario: Supabase + CSV Workflow
The document notes that Supabase is already partially configured. For an academic researcher who ultimately needs a CSV file for analysis (e.g., in SPSS, R, or Excel), the best-case architecture looks like this:

1.  **Secure Ingestion (PostgreSQL):** The app uses the Supabase Javascript client to send data. Instead of an open POST endpoint, Supabase uses an `anon` API key combined with strict **Row Level Security (RLS)**. The RLS policy is set so the browser can *only* "Insert" data, but cannot "Read", "Update", or "Delete" existing rows. This prevents bad actors from scraping the database.
2.  **Frictionless CSV Extraction:** The researcher does not need to build a custom admin dashboard. Supabase provides a secure, web-based Table Editor. The researcher simply logs into their Supabase account, views the structured data, and clicks the **"Export to CSV"** button.
3.  **The Result:** The app gets enterprise-grade security and EU data residency (Frankfurt), while the researcher still gets the simple, portable CSV file they need for their statistical software.

#### B. Building on Recommendation 2: Implementing the Consent UI
The document rightly notes the lack of a formalized consent record. To make this legally robust without ruining the user experience, the implementation must be precise:

* **UI Implementation:** Before the survey begins, present a clean, single-screen modal. It should state: *"This is an academic tool studying wardrobe habits. We collect your responses and a randomized session ID. We do not collect your name, email, or device data."*
* **Active Action:** Require the user to actively click a checkbox: `[ ] I understand and agree to participate.` followed by a "Begin" button.
* **Database Logging:** The payload sent to Supabase MUST include two new columns: `consent_given` (boolean: true) and `consent_timestamp` (ISO 8601 standard time). This satisfies the GDPR requirement to *demonstrate* that consent was obtained.

#### C. Building on Recommendation 3: Formalizing the Data Management Plan (DMP)
A vague recommendation to "define a retention period" is insufficient for institutional ethics boards. The DMP must explicitly define the data lifecycle:

* **Trigger-Based Deletion:** Do not use arbitrary dates (e.g., "delete in 2028"). Tie retention to academic milestones. Example: *"Raw response data will be deleted from Supabase 12 months after the publication of the final research paper or thesis."*
* **Access Control:** Explicitly state who has access to the Supabase dashboard (e.g., "Only the primary researcher and the faculty supervisor").
* **Documentation Binding:** Download the standard GDPR Data Processing Agreement (DPA) provided by Supabase and store it alongside the DMP in the university's internal records system.
