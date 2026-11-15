# ELDERCARE 360: Lint & Strict Compiler Exceptions Register

This document registers every deliberate exception to strict linter and compiler rules. Every exception must have a technical justification and safety assessment.

---

## 1. Registered Exceptions

| Exception ID | Rule / Check | File & Location | Justification & Safety Assessment | Expiry / Review |
| :--- | :--- | :--- | :--- | :--- |
| **LE-01** | `any` type in Firebase Analytics initialization | `src/firebase/firebaseConfig.ts` line 22 | Analytics SDK returns dynamic browser-dependent instance that may be null or undefined when SSR or mobile container is active. Wrapped in `isSupported()` check. | 2027-01-01 |
| **LE-02** | Type casting `as UserProfile` on Firestore read | `src/firebase/authService.ts` line 92 | Firestore `docSnap.data()` returns `DocumentData`. Validated against `UserProfile` interface before storage. | 2027-01-01 |
| **LE-03** | Use of `setTimeout` for UI navigation transitions | `src/pages/AuthPage.tsx` line 88 | Smooth 700ms visual feedback transition allowing user to read success toast before route transition. | 2027-01-01 |

**Policy Note:** No exceptions are permitted in `packages/domain` or `packages/contracts`. All domain logic remains 100% strictly typed.
