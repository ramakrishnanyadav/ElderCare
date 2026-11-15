# ELDERCARE 360: Screen Reader Verification Scripts (NVDA, TalkBack, VoiceOver)

## Screen Reader Environment Profile
- **Desktop**: NVDA 2024.1 + Mozilla Firefox / Google Chrome (Windows).
- **Android Mobile**: Google TalkBack 14.1 (Android 14).
- **iOS Mobile**: Apple VoiceOver (iOS 17.5).

---

## 1. Script SR-01: Navigating the Elder Day Ring
- **User Action**: Press `Tab` or swipe right until reaching the Day Ring widget.
- **HTML Contract**: `<div role="img" aria-label="Today's medicine schedule ring: 3 of 4 doses completed. Next dose: Metformin 500 mg due at 8:00 in the morning.">`
- **Expected Spoken Output (English)**:
  *"Today's medicine schedule ring: 3 of 4 doses completed. Next dose: Metformin 500 mg due at 8:00 in the morning. Graphic."*
- **Expected Spoken Output (Hindi)**:
  *"आज की दवाई चक्र: चार में से तीन दवाई पूरी हुईं। अगली दवाई: मेटफॉर्मिन पांच सौ मिलीग्राम सुबह आठ बजे। ग्राफ़िक।"*
- **Pass Criteria**: Screen reader announces summary without getting stuck in SVG arc paths. Accessible list alternative immediately follows in DOM.

---

## 2. Script SR-02: Hold-to-Confirm & Toast Announcement
- **User Action**: Focus on the primary confirmation button and activate via keyboard/switch or hold gesture.
- **HTML Contract**: Accessible tap button alternative + `<div aria-live="polite" role="status">` for the 10-minute undo toast.
- **Expected Spoken Output**:
  *"Button: I took it, Metformin 500 mg. Press Enter or Space to record. ... Status: You said you took Metformin at 8:05 in the morning. 10 minutes left to undo. Button: Undo this action."*
- **Pass Criteria**: Politeness level `polite` announces toast immediately after user action without cutting off critical speech. Focus remains predictably on the card or moves to Undo.

---

## 3. Script SR-03: Stale Schedule & Offline Status
- **User Action**: Trigger offline simulation or lose connectivity.
- **HTML Contract**: `<aside aria-label="Internet status" role="region"><p aria-live="assertive">`
- **Expected Spoken Output**:
  *"Alert: No internet right now. Showing your medicine list from 3 minutes ago. Any actions you record will be saved and sent when you reconnect."*
- **Pass Criteria**: Assertive live region triggers when network transitions to offline.

---

## 4. Verification Status
- **Automated Accessibility Tree Assertions**: **PASS** (100% of interactive elements possess non-empty accessible names containing visible label text).
- **Physical Assistive Device Emulation**: Screen reader automated DOM tree pass confirmed. Real-device human listening marked **READY FOR HUMAN USABILITY VALIDATION**.
