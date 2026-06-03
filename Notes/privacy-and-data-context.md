# Wardrobe Mirror — Privacy & Data Context
**Document type:** Internal research reference  
**Jurisdiction:** Netherlands (EU)  
**Supervisory authority:** Autoriteit Persoonsgegevens (AP)  
**Date:** May 2026  
**Status:** Working document — not for participant distribution in current form

---

## 1. What the tool is

The Wardrobe Mirror is a browser-based diagnostic survey tool built for academic research. It explores clothing decision-making behaviour through three sequential question sets:

- **Set A** — a garment acquired in the last year (recent purchase)
- **Set B** — the participant's favourite garment
- **Set C** — a garment the participant intends to dispose of

Each set asks 6–12 questions about how the garment was acquired, how it is used, how often it is worn, and what meaning or function it holds. After completing the sets, the tool generates a behavioural archetype and a value profile (social, emotional, functional, and inflow/outflow dimensions) for the participant to reflect on.

The tool presents itself explicitly as a diagnostic reflection — participants are told upfront they are answering a structured survey about their wardrobe habits. It is not disguised as entertainment or a commercial product. Participants are briefed verbally or by message before accessing the link.

---

## 2. What data is collected

### Collected automatically per session
| Field | Description |
|---|---|
| Session ID | Randomly generated string (timestamp + random chars). Not linked to identity. |
| Timestamp | Date and time the session was completed |

### Collected through responses
| Field | Description |
|---|---|
| Wardrobe size | Self-reported: minimal / moderate / extensive |
| Shopping frequency | Self-reported: rarely / occasionally / frequently |
| Disposal habit | Self-reported: rarely / periodically / regularly |
| Primary driver | Self-reported: functionality / personal value / social context |
| Garment type | Selected from preset list or free text |
| How acquired | Bought new / second-hand / gift / borrowed / made |
| Cost | Approximate price bracket (€0–€100+) |
| Wear frequency | How often the item is worn |
| Primary use | Categorical: home / leisure / sport / work / occasions / other |
| Repair behaviour | Whether the item has been repaired and how |
| Disposal plan | Intended method of letting go |
| Behavioural archetype | Computed from responses (e.g. Memory Keeper, Functional Minimalist) |
| Value scores | Four computed scores (0–100 scale each) |

### What is NOT collected
- Name
- Email address
- Physical address
- IP address
- Device identifiers
- Location data
- Any data that directly identifies the participant

---

## 3. Data classification under GDPR

### Is this personal data?

Under GDPR Article 4(1), personal data is any information relating to an **identified or identifiable** natural person. The Wardrobe Mirror collects:

- **No direct identifiers** (name, email, ID number)
- **A pseudonymous session ID** that cannot be linked back to a person without additional information the researcher does not hold
- **Behavioural and attitudinal data** about clothing habits — not health, political, religious, ethnic, or financial data

**Assessment:** The data is best classified as **pseudonymous behavioural data**. It is technically personal data under GDPR (because it relates to a person's behaviour) but sits at the lowest end of the sensitivity spectrum. It does not fall under the special categories listed in GDPR Article 9.

### Legal basis for processing

For academic institutional research in the Netherlands, the appropriate legal basis is one of:

- **Article 6(1)(a) — Consent:** Participant agrees to participate in the study. Given that participants are briefed before accessing the tool, informed consent is the most straightforward basis.
- **Article 6(1)(e) — Public task / legitimate interest of research:** Applicable where the research serves a demonstrable scientific purpose and is conducted under institutional oversight.

For academic research specifically, **Article 89 GDPR** provides a research exemption that allows certain GDPR rights (like erasure and portability) to be restricted where they would seriously impair the research objectives — provided appropriate safeguards are in place.

**Recommended basis for this tool:** Article 6(1)(a) consent, documented through the verbal/message briefing that currently precedes participation. This should be formalised (see Section 6).

---

## 4. The Google Sheets flagging — what happened and why

### What the original setup was

Survey responses were submitted from the browser to a **Google Apps Script web app** deployed as a public HTTP endpoint. The Apps Script received POST requests containing the response data and appended rows to a Google Sheet stored on a personal (consumer) Google account.

### Why Google flagged it

Google's automated abuse detection systems flagged the sheet with a Terms of Service violation. The most likely triggers:

1. **Unauthenticated public endpoint receiving POST data from multiple external IP addresses** — this matches patterns Google associates with phishing form collection and data harvesting infrastructure
2. **Consumer account vs. Workspace account** — consumer Google accounts (gmail.com) have lower thresholds for automated flagging. The Apps Script public web app pattern is technically permitted but is monitored heavily on consumer accounts
3. **EU account + personal data pattern** — Google applies additional automated scrutiny to EU-region accounts where data collection patterns are detected, partly as a liability management measure under GDPR
4. **No authentication on the endpoint** — the Apps Script URL was publicly accessible, meaning any external actor could POST arbitrary data to it. This is structurally similar to how phishing kits collect credentials, which likely contributed to the flag

### What the flag means practically

- The Google Sheet is locked and inaccessible
- The Apps Script endpoint is likely suspended
- Data submitted during the active period may be recoverable if the sheet can be restored via appeal, but this is uncertain
- Submitting an appeal through the Google Drive Help Centre is possible but may take days and is not guaranteed to succeed for consumer accounts

### Is this a GDPR violation?

No. The Google flag is a **Terms of Service enforcement action** by Google against the account holder's use of their platform, not a regulatory finding under GDPR. No personal data was shared with third parties improperly — it was routed to the researcher's own storage. However, the episode highlights that:

- Personal (consumer) Google accounts are not appropriate infrastructure for research data collection
- The lack of a data processing agreement with Google for this use case is a gap worth addressing

---

## 5. EU and Dutch privacy law — relevant context

### GDPR (General Data Protection Regulation)

Applies directly across all EU member states. Key obligations relevant to this tool:

| Obligation | Relevance to Wardrobe Mirror |
|---|---|
| **Lawful basis** | Must have a documented basis for collecting response data (consent recommended) |
| **Transparency** | Participants must be informed what data is collected, why, how it is stored, and who has access |
| **Data minimisation** | Only collect what is necessary — the current schema is lean and appropriate |
| **Storage limitation** | Data should not be kept longer than necessary for the research purpose |
| **Security** | Data must be protected against unauthorised access or loss |
| **Data subject rights** | Participants have rights to access, rectify, and erase their data |

### Dutch implementation (UAVG — Uitvoeringswet AVG)

The Netherlands implements GDPR through the UAVG. For academic research specifically:

- The **AP (Autoriteit Persoonsgegevens)** is the supervisory authority. They publish guidance specifically for scientific research.
- Dutch universities and institutions operate under the **VSNU/KNAW/NWO Netherlands Code of Conduct for Research Integrity**, which includes data management obligations
- Most Dutch research institutions require a **Data Management Plan (DMP)** for studies involving personal data
- The institution likely has its own **privacy officer** and **ethics review process** — these should be consulted if not already done

### What is not required for this tool (given its low-risk profile)

- A **Data Protection Impact Assessment (DPIA)** is required under GDPR Article 35 only for processing likely to result in high risk. Pseudonymous behavioural wardrobe data at small research scale does not meet this threshold.
- **Registration with the AP** is not required for most academic research under the research exemption.

---

## 6. Gaps in the current setup

These are not necessarily violations but are areas to address before wider deployment:

### Missing: Formalised participant consent record
Participants are currently briefed verbally or by message, but there is no in-app consent step and no record that consent was given. Under GDPR Article 7, where consent is the legal basis, the controller must be able to demonstrate that consent was obtained.

**Recommended action:** Add a brief consent screen at the start of the app (before the welcome screen begins) that states what is being collected and why, with an explicit "I agree to participate" confirmation. This does not need to be long — two or three sentences and a button is sufficient.

### Missing: Participant-facing privacy notice
There is currently no privacy statement visible to participants explaining their rights.

**Recommended action:** A short privacy notice linked from the consent screen or the app footer. This is distinct from this internal document.

### Missing: Stable, appropriate data storage
The Google Sheets setup has failed. Participant data from submitted sessions may be at risk of loss.

**Recommended action:** See Section 7.

### Missing: Data retention policy
No defined period for how long response data will be kept.

**Recommended action:** Define a retention period tied to the research timeline (e.g. data deleted 12 months after the study concludes, or upon submission of the thesis/paper).

### Missing: Data processing agreement with storage provider
Whichever service stores the data (Google, Supabase, Vercel, etc.) is technically a **data processor** under GDPR. A Data Processing Agreement (DPA) should be in place. Most major providers offer standard DPAs — Google Workspace, Supabase, and Vercel all have GDPR DPAs available.

---

## 7. Current options being explored for data storage

The following alternatives to the Google Apps Script setup are under active consideration:

### Option A — CSV auto-download only
Remove all server-side submission. At the end of each session the app downloads a CSV file to the participant's device. Participants share the file with the researcher via a designated channel (email, shared drive folder).

- **Risk level:** Lowest — no server involved
- **GDPR fit:** Strong — data never leaves participant's device until they actively send it
- **Practical concern:** Relies on participants remembering to send the file; manual collection overhead for the researcher

### Option B — EmailJS (browser-to-email)
A free third-party service (EmailJS) sends the response data directly to the researcher's email inbox from the browser, without a backend server. Free tier supports ~200 submissions/month. EU data routing available.

- **Risk level:** Low
- **GDPR fit:** Requires a DPA with EmailJS; data transits their servers
- **Practical concern:** Inbox-based collection does not scale well; no structured database view

### Option C — Google Workspace account
Upgrade from a consumer Google account to a Google Workspace account (paid). The same Apps Script pattern would work without triggering automated abuse flags. Workspace accounts include a standard GDPR DPA with Google.

- **Risk level:** Low — Google flags consumer accounts, not Workspace
- **GDPR fit:** Google Workspace GDPR DPA covers this use case
- **Practical concern:** Monthly cost (~€6); requires recreating the sheet and redeploying the Apps Script

### Option D — Google Sheets API + serverless function
Deploy a small serverless function (e.g. on Vercel's free tier) that holds Google service account credentials securely and proxies write requests to the Google Sheets API. The app calls the function instead of the Apps Script directly.

- **Risk level:** Low — credentials never exposed in browser code
- **GDPR fit:** Vercel has an EU region and GDPR DPA; Sheets is covered by Workspace DPA if used with a Workspace account
- **Practical concern:** Moderate setup complexity (~1 hour); requires a Google Cloud project and service account

### Option E — Supabase (already configured)
The project already has Supabase credentials in place from an earlier version of the app (`utils/supabase/info.tsx`). Supabase offers an EU data region (Frankfurt), is GDPR-compliant, and provides structured storage with a proper dashboard for viewing responses.

- **Risk level:** Low
- **GDPR fit:** Supabase offers a GDPR DPA and EU region hosting
- **Practical concern:** Requires re-wiring the submission function in the app; Supabase project must be confirmed active

---

## 8. Recommended immediate actions

1. **Appeal the Google flag** via the Drive Help Centre link on the error page — attempt to recover any previously collected data
2. **Choose and implement a replacement storage option** from Section 7 before collecting further data
3. **Add a consent screen** to the app (brief, two to three sentences) before the welcome screen
4. **Consult the institution's privacy officer or ethics board** to confirm the study's data management approach is aligned with the institution's requirements
5. **Define a data retention period** and document it in the project's data management plan
6. **Obtain a DPA** from whichever storage provider is chosen

---

*This document is an internal working reference. It reflects the situation as of May 2026 and should be updated as the data storage approach is resolved and consent mechanisms are added to the tool.*
