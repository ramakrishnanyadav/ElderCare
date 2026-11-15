# ELDERCARE 360: Elder Usability Testing Protocol

## 1. Objective & Ethical Principles
This testing protocol evaluates the real-world usability and accessibility of the ELDERCARE 360 Elder Interface (Simple Mode) with adults aged 65+ living in India (semi-urban and urban contexts).

**Core Safety & Ethical Principles:**
1. **Voluntary Consent & Informed Participation**: Written or witnessed oral consent in Hindi or English. Elders may pause or withdraw at any point without losing healthcare benefits or circle membership.
2. **Zero Clinical Harm**: All test environments run on isolated synthetic demo accounts (Kamala Devi persona). No actual medications are consumed during testing.
3. **Dignity & Autonomy First**: The elder is evaluated on system clarity; testing never judges the participant's cognitive or digital abilities.

---

## 2. Participant Demographics (Target N = 20)
- **Age**: 65 to 84 years (mean: 72).
- **Languages**: Hindi (primary or bilingual), English.
- **Vision / Motor Profile**: Mild-to-moderate presbyopia, cataract surgery history, tremors / arthritis (fine motor limitations).
- **Devices**: Standard low-to-mid range Android smartphones (6-inch screen, 720p/1080p) and tablets.

---

## 3. Evaluation Tasks (8 Core User Journeys)

### Task 1: Identify the Next Due Medicine
- **Prompt (English)**: "Look at your home screen. What is the next medicine you need to take today, and at what time?"
- **Prompt (Hindi)**: "अपनी मुख्य स्क्रीन देखिए। आज आपको अगली कौन सी दवाई किस समय लेनी है?"
- **Success Criteria**: Identifies the medicine name (or color/shape) and due time within 15 seconds without assistance.
- **Target Completion**: 95% pass.

### Task 2: Confirm a Dose via Hold-to-Confirm
- **Prompt**: "Imagine you have just taken your morning Metformin. Please record it on the screen."
- **Focus**: Observe physical reaction to the 600ms hold gesture. Does the filling progress ring and pulse provide adequate haptic/visual feedback?
- **Alternative**: Test keyboard/switch accessible tap-confirmation alternative.
- **Success Criteria**: Completes confirmation in single attempt; understands that the screen records "Patient-Reported" evidence.

### Task 3: Mistake Recovery (10-Minute Undo)
- **Prompt**: "You pressed the button by accident for a pill you didn't take. Undo this action."
- **Focus**: Recognition of the 10-minute draining ring countdown toast.
- **Success Criteria**: Taps "Undo" within 30 seconds; observes state return to "Due Now".

### Task 4: One-Touch Emergency & Family Call
- **Prompt**: "You are feeling dizzy and want to contact your daughter Anita immediately. How would you call her?"
- **Focus**: Emergency / Help tab accessibility, high-contrast 56px touch target.
- **Success Criteria**: Initiates dialer or family alert within 10 seconds.

### Task 5: Transparency Ledger ("Who Saw My Data?")
- **Prompt**: "Check who has looked at your health information this week."
- **Focus**: Plain-language consent ledger (`docs/DECISIONS.md`).
- **Success Criteria**: Navigates to Circle/Ledger and correctly identifies the names of family members who accessed the log.

### Task 6: Privacy Pause ("Pause Family Sharing")
- **Prompt**: "You want to turn off family notifications for the afternoon so you can rest without calls. Where do you pause sharing?"
- **Focus**: Toggle switch clarity, plain-language description ("Safety alerts remain active").
- **Success Criteria**: Successfully toggles Privacy mode and reads confirmation.

### Task 7: Understanding a Missed-Dose Email/Notification
- **Prompt**: "Look at this notification sent to your daughter. Does it describe your disease or just state that a dose check is needed?"
- **Focus**: Privacy compliance (zero PHI in subjects/bodies).
- **Success Criteria**: Confirms zero sensitive clinical diagnostic details are revealed.

### Task 8: Offline Stale Schedule Recovery
- **Prompt**: "Your internet connection is disconnected. What does the banner at the top tell you?"
- **Focus**: Staleness banner clarity ("Offline mode - Showing schedule from 2 hours ago").
- **Success Criteria**: Reads the staleness warning and understands offline updates are queued in the outbox.

---

## 4. Usability Metrics & Scoring Sheet

| Metric | Target | Formula / Benchmark |
| :--- | :--- | :--- |
| **Task Completion Rate** | $\ge 90\%$ across all 8 tasks | $\frac{\text{Successful Tasks}}{\text{Total Tasks}} \times 100$ |
| **Single-Gesture Confidence** | $\ge 4.2 / 5.0$ Likert | Post-task prompt: "I felt confident pressing this button" |
| **Touch Target Precision** | $< 5\%$ accidental taps | Errors due to $< 56\text{px}$ boundary clipping |
| **System Usability Scale (SUS)** | $\ge 82$ (Grade A) | 10-item standard SUS questionnaire translated to Hindi |

---

## 5. Session Observer Template & Consent Log
```
Participant ID: ELDER-IN-04
Age: 73 | Primary Language: Hindi | Visual Aid: Bifocals
Task 1 (Next Med): PASS (8s) - Immediately pointed to Teal "Due Now" card
Task 2 (Hold-to-Confirm): PASS (600ms hold intuitive after ring animation)
Task 3 (Undo): PASS (Undone at T+12s)
Observations / Quotes: "रंग साफ़ दिख रहा है, अक्षरों का आकार बहुत सुविधाजनक है।" (Colors are clear, text size is very convenient)
```
