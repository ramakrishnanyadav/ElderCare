# ELDERCARE 360: 5-Minute End-to-End Problem Statement Walkthrough

This demo script demonstrates that 100% of the problem statement clauses are fully operational in the running product within 5 minutes.

---

## Demo Personas & Pre-Seeded Accounts
- **👵 Elder**: Kamala Devi (`user-elder-kamala`, PIN: `1234`)
- **👩 Family Admin**: Anita Sharma (Daughter, `user-family-anita`)
- **👨 Family Member**: Rahul Sharma (Son, `user-family-rahul`)
- **🩺 Caregiver**: Sunita Devi (`user-caregiver-sunita`)
- **👩‍⚕️ Clinician**: Dr. Priya Verma (`user-clinician-priya`)

---

## 12-Step Walkthrough Script

### Step 1: Elder PIN Login (Passcode-Based Secure Access)
- **Action**: Open `http://localhost:5173/onboarding` and enter registered device PIN `1234`.
- **Verify**: Locks into **Elder Mode**. Large 56px+ buttons, high-contrast `#0B554F` teal controls.

### Step 2: The Day Ring & Next Due Medicine
- **Action**: View the 24-hour Day Ring on the home screen.
- **Verify**: 4 doses plotted on arc segments. Metformin 500mg highlighted as **"⏰ Due Now"** with breakfast instructions.

### Step 3: Hold-to-Confirm & 10-Minute Mistake Undo
- **Action**: Press and hold the "I took it" button for 600ms (or tap for keyboard/switch alternative).
- **Verify**: Progress ring completes with a subtle pulse. State updates to **"✓ Taken (Patient-Reported)"**. A 10-minute draining ring toast appears: *"You said you took Metformin at 8:05 AM. 10 minutes left to undo."*

### Step 4: Switch to Family Dashboard
- **Action**: Use the header mode switcher to switch to **"👨‍👩‍👧 Family"** (Anita Sharma).
- **Verify**: The updated dose appears for Anita immediately with the `PATIENT_REPORTED` evidence chip.

### Step 5: Adherence Evidence-Mix Bar
- **Action**: Navigate to `/report` or view the Adherence section.
- **Verify**: Adherence is shown as a segmented **Evidence-Mix Bar** (Patient-Reported, Caregiver-Witnessed, Clinician-Confirmed), never a misleading single percentage.

### Step 6: Advance Time to Trigger Missed Dose (+45m Grace End)
- **Action**: Click the floating **"⏱️ Time-Travel"** control in the bottom right and tap **"+45m (Grace End)"**.
- **Verify**: Unconfirmed evening dose transitions to **"✕ Missed"**. An obligation is automatically created in the Obligations tab.

### Step 7: Escalation Ladder & Real Mailpit Email (+75m Primary Alert)
- **Action**: In the Time-Travel control, tap **"+30m (Primary)"**.
- **Verify**: Active Escalation Ladder fires Tier 2. Open Mailpit (`http://localhost:8025`).
- **Verify Email**: A notification arrives for Anita Sharma: *"Action Required: Kamala Devi has an unconfirmed medication check due."* **Notice: Zero drug names or medical conditions appear in the email subject or body.**

### Step 8: Routine Timing Edit with 24-Hour Undo
- **Action**: In Family Meds (`/medicines`), edit the morning routine from 8:00 AM to 8:30 AM.
- **Verify**: Change is saved; an undo banner appears: *"Routine timing changed. 24 hours left to rollback."* Kamala is notified.

### Step 9: Propose-then-Approve for Prescription Changes
- **Action**: Anita proposes increasing Telmisartan from 40mg to 80mg with document reference `PRESCRIP-2026-NOV`.
- **Action**: Anita tries to approve her own proposal $\to$ **Rejected** ("Proposer cannot approve their own change").
- **Action**: Switch user to Dr. Priya Verma or Rahul Sharma $\to$ Click "Approve" $\to$ New medication version generated.

### Step 10: Doctor Visit Companion & Post-Visit Reconciliation
- **Action**: Open `/appointments` $\to$ Click **"Dr. Verma - Cardiology"** $\to$ Open "Pre-Visit Brief".
- **Verify**: Templated brief aggregates blood pressure history and active verified medicines. Post-visit notes suggest changes as proposals, never auto-applied.

### Step 11: Elder Transparency & Privacy Controls (Pause Sharing / Lock)
- **Action**: Switch back to Elder Mode $\to$ Navigate to `/circle`.
- **Verify**: **Plain-Language Access Ledger** shows: *"Anita Sharma viewed your medication schedule at 8:35 AM."*
- **Action**: Toggle **"Pause Sharing"** or **"Emergency Lock"**.
- **Verify**: Non-critical family sharing pauses instantly; safety alerts remain guarded.

### Step 12: Next-Request Consent Revocation
- **Action**: Elder revokes Sunita Devi (Caregiver) from the Care Circle.
- **Action**: Sunita attempts to query the schedule $\to$ **Immediate HTTP 403 Forbidden / 401 Unauthorized** on the very next request.
