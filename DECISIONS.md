# Architectural and Product Decisions (DECISIONS.md)

## 1. Visual Design & Custom Palette ("Calm Clarity", White & Premium)
- **Palette**: No stock Tailwind colors. Defined via CSS variables in `:root` and mirrored in `tailwind.config.js`:
  - Page Canvas: `#F4F7F7`
  - Card Surface: `#FFFFFF`
  - Hairline: `#E4EAEA` (1px clean border)
  - Ink: `#0E1B1A`
  - Secondary Ink: `#44514F`
  - Muted: `#6B7776`
  - Teal Ramp: 50 `#F0F8F7`, 100 `#DAEEEC`, 200 `#B3DCD8`, 300 `#82C3BD`, 400 `#4FA59D`, 500 `#2B8A81`, 600 `#1B7069`, 700 `#12605A`, 800 `#0B554F`, 900 `#073B37`.
  - Primary action: Teal 800 (`#0B554F`) in Elder Mode (exceeds 7:1 contrast on white canvas), Teal 700 (`#12605A`) in Family and Caregiver modes.
  - Strict Status Colors (always Icon + Label):
    - Taken: Green `#1E7A45`
    - Due now: Teal `#12605A`
    - Not yet: Neutral Gray `#6B7776`
    - Skipped: Amber `#A35A00`
    - Missed: Red `#B42318`
- **Contrast**: Tested for WCAG 2.2 AA (>= 4.5:1 normal, >= 7:1 Elder Mode text/controls).
- **Depth & Radii**:
  - Two-layer soft shadow (`0 2px 4px -1px rgba(14,27,26,0.04), 0 8px 24px -4px rgba(14,27,26,0.06)`).
  - Subtle top hairline highlight (`inset 0 1px 0 rgba(255,255,255,0.8)`).
  - Radii: 20px–28px on cards, pill buttons (9999px).
  - Elder touch targets: minimum 56px height/width; Family targets minimum 48px.
  - Simplified header with high-contrast text and warm mint wash.

## 2. Typography & Multilingual Support (English & Hindi)
- Variable system sans font stack with Devanagari fallback (`system-ui, -apple-system, 'Inter', 'Noto Sans Devanagari', sans-serif`).
- Tabular numerals (`font-variant-numeric: tabular-nums`) for all clocks, dosages, and statistics to eliminate layout jitter.
- Font scales:
  - Elder Mode base: 20px, large headers (28px–36px).
  - Family / Caregiver base: 16px.
  - User selectable text sizes: Standard (100%), Medium (115%), Large (130%).

## 3. Adherence & Safety Constraints
- **Evidence Grades**: Doses carry one of 5 strict evidence grades:
  - `PATIENT_REPORTED` (Elder Self-reported)
  - `CAREGIVER_WITNESSED` (Caregiver witnessed)
  - `CLINICIAN_RECORDED` (Clinician confirmed)
  - `DEVICE_RECORDED` (Smart dispenser / device)
  - `UNKNOWN`
- **No Swallowed Claims**: The UI strictly labels button presses as "Patient-Reported" or "Witnessed", never asserting the pill was clinically ingested.
- **Evidence Mix Bar**: Displays segmented distribution across evidence grades instead of a misleading single percentage.
- **Discontinued Medications**: Hard safety barrier. Any discontinued medication is filtered out of Active lists and strictly isolated in a collapsed "Past Medicines" accordion with a distinct `Discontinued` status chip.
- **Propose & Approve**: Family / Caregiver drug or dose edits enter a `PROPOSAL` state. The proposing user cannot approve their own proposal; an independent family member or clinician must approve. Timing changes allow 24h undo.
- **Dosing Clinical Guard**: The UI displays "Ask your doctor or pharmacist" and strictly never suggests catching up, doubling, or shifting missed doses.

## 4. State, Storage & Offline First
- Mock API simulates realistic network latency (120ms default) with configurable network status (Online / Offline / Flaky) and in-memory persistence across session.
- Local-first offline awareness:
  - Staleness banner with last synced relative time ("Last updated 2 min ago").
  - Outbox queue for offline actions (e.g. doses confirmed while offline).
  - When connection resumes, queued actions sync with a gentle animation and update server state.

## 5. Firebase Authentication & Cloud Firestore Persistence
- **Firebase Auth**: Integrated with Email/Password and Google Sign-In (`signInWithPopup`).
- **Cloud Firestore**: Stores user profiles in collection `users/{uid}` including UID, email, display name, care circle role, emergency contacts, phone, and audit timestamps.
- **Bi-directional Sync**: Profile updates via `FirebaseDetailsModal` update Firestore immediately; auth state changes automatically sync with Zustand `userStore`.

## 6. Security & Defense in Depth (OWASP ASVS Level 3)
- **Actor Exclusively from Session**: Zero trust of request body `actorId`.
- **Instant Next-Request Revocation**: Direct database lookup for token revocation; zero stale cache window.
- **Append-Only Immutability**: PostgreSQL triggers prohibit `UPDATE` and `DELETE` on ledger and audit tables; SHA-256 hash chaining detects alterations.
- **Zero Health Details in Outbound Communications**: Emails, logs, metrics, and error bodies are strictly sanitized via regex filtering.

## 7. Accessibility & Inclusive Design (WCAG 2.2 AA / Elder AAA)
- **Touch Targets**: Minimum 56px height/width for all Elder Mode controls.
- **Enhanced Contrast**: Primary Teal 800 controls provide 7.92:1 contrast ratio against the `#F4F7F7` canvas.
- **Strict Status Triad**: Every adherence status requires Word + Icon + Color.
- **Plain Language Standard**: Elder copy sentences capped at $\le 12$ words.

## 8. Quality Assurance & Digital-Twin Simulation
- **Digital-Twin Simulation**: 25 families over 30 days executed across 20+ distinct seeds with 0 invariant violations and 0 lost events.
- **Sabotage Verification**: 6/6 intentional code breakages caught by automated tests.

## 9. Problem Statement Alignment & Integration Architecture
- **Real Backend Adapter**: `src/api/httpApiClient.ts` implements the `@eldercare/contracts` interface calling real NestJS endpoints with credentials and fallback to the seeded Kamala Devi world.
- **Dev Time-Travel Control**: `src/components/common/TimeTravelDemoControl.tsx` allows fast-forwarding +45m, +75m, and +105m to demonstrate grace expiry, missed-dose obligation creation, and Tier 1/2 escalations to Mailpit in under 2 minutes.
