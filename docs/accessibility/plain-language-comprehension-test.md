# ELDERCARE 360: Plain Language Comprehension & Cloze Test Protocol

## 1. Test Methodology
This protocol verifies that safety-critical notifications, instructions, and error messages are understood by adults aged 65+ without confusion or clinical misinterpretation.

**Format**: 
- **Paraphrase Testing**: The elder reads a system message and is asked: *"In your own words, what is this screen telling you, and what would you do next?"*
- **Cloze Testing**: Every 5th word of a critical instruction is blanked out to measure linguistic predictability and reading ease.

---

## 2. Test Materials & Prompts

### Case 1: Missed Dose & Escalation Notice
- **Presented Text**:
  *"You have a medicine due at 8:00 in the morning. Your daughter Anita will receive a gentle reminder in 30 minutes to check in with you."*
- **Comprehension Questions**:
  1. *Who is supposed to take a medicine?* (Target: The participant).
  2. *Will Anita get a phone call immediately or later?* (Target: In 30 minutes, not right now).
  3. *Does this message reveal your disease name?* (Target: No, only mentions medicine time).
- **Pass Benchmark**: $\ge 90\%$ correct comprehension across cohort ($N=20$).

### Case 2: Offline Stale Schedule Notice
- **Presented Text**:
  *"No internet right now. Showing your medicine list from 3 minutes ago. We will send your updates when connection returns."*
- **Comprehension Questions**:
  1. *Can you still use the screen to see your medicines?* (Target: Yes, list is still visible).
  2. *Will your answers be lost when you press a button?* (Target: No, they will be sent later).
- **Pass Benchmark**: $\ge 95\%$ correct comprehension.

### Case 3: Doctor Visit Post-Reconciliation Proposal
- **Presented Text**:
  *"Dr. Priya suggested changing your morning medicine time to 8:30 AM. Your daughter Anita needs to approve this change before your schedule updates."*
- **Comprehension Questions**:
  1. *Has your medicine time changed already?* (Target: No, awaiting Anita's approval).
  2. *Who needs to confirm this change?* (Target: Anita / second approver).
- **Pass Benchmark**: $\ge 90\%$ correct comprehension.
