import React, { useState } from 'react';
import { StatusChip } from '../components/common/StatusChip';
import { EvidenceChip } from '../components/common/EvidenceChip';
import { EvidenceMixBar } from '../components/common/EvidenceMixBar';
import { HoldToConfirmButton } from '../components/elder/HoldToConfirmButton';
import { DayRing } from '../components/elder/DayRing';
import { CareCirclePresence } from '../components/family/CareCirclePresence';
import { EscalationLadder } from '../components/family/EscalationLadder';
import { AccessLedgerView } from '../components/family/AccessLedgerView';
import { ElderPinKeypad } from '../components/elder/ElderPinKeypad';
import { useMockStore } from '../store/mockStore';

export const ComponentKitPage: React.FC = () => {
  const slots = useMockStore((s) => s.slots);
  const [demoConfirmed, setDemoConfirmed] = useState(false);

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-24">
      {/* Intro Header */}
      <div className="border-b border-hairline pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            Design System & Component Kit
          </span>
          <span className="text-xs text-ink-muted">Route: /kit</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
          "Calm Clarity" Design System
        </h1>
        <p className="text-sm text-ink-secondary max-w-2xl">
          Complete living catalog of every token, status chip, evidence component, interactive gesture, and accessibility control in ELDERCARE 360.
        </p>
      </div>

      {/* 1. PALETTE TOKENS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">1. Custom Color Tokens & Contrast Ramps</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
          <div className="card-premium p-3 rounded-card space-y-1">
            <div className="h-10 rounded bg-[#F4F7F7] border border-hairline" />
            <div className="font-bold text-ink">Canvas</div>
            <div className="text-ink-muted">#F4F7F7</div>
          </div>
          <div className="card-premium p-3 rounded-card space-y-1">
            <div className="h-10 rounded bg-[#FFFFFF] border border-hairline" />
            <div className="font-bold text-ink">Surface</div>
            <div className="text-ink-muted">#FFFFFF</div>
          </div>
          <div className="card-premium p-3 rounded-card space-y-1">
            <div className="h-10 rounded bg-[#E4EAEA]" />
            <div className="font-bold text-ink">Hairline</div>
            <div className="text-ink-muted">#E4EAEA</div>
          </div>
          <div className="card-premium p-3 rounded-card space-y-1">
            <div className="h-10 rounded bg-[#0E1B1A]" />
            <div className="font-bold text-ink">Ink</div>
            <div className="text-ink-muted">#0E1B1A</div>
          </div>
          <div className="card-premium p-3 rounded-card space-y-1">
            <div className="h-10 rounded bg-[#12605A]" />
            <div className="font-bold text-ink">Teal 700 (Family)</div>
            <div className="text-ink-muted">#12605A</div>
          </div>
          <div className="card-premium p-3 rounded-card space-y-1">
            <div className="h-10 rounded bg-[#0B554F]" />
            <div className="font-bold text-ink">Teal 800 (Elder)</div>
            <div className="text-ink-muted">#0B554F</div>
          </div>
        </div>

        {/* Status Colors: Strict 1-per-status with Icon + Word */}
        <h3 className="text-sm font-bold text-ink pt-2">Strict Status Palette (One color per status everywhere)</h3>
        <div className="flex flex-wrap gap-3">
          <StatusChip status="TAKEN" size="lg" />
          <StatusChip status="DUE" size="lg" />
          <StatusChip status="NOT_YET" size="lg" />
          <StatusChip status="SKIPPED" size="lg" />
          <StatusChip status="MISSED" size="lg" />
          <StatusChip status="DISCONTINUED" size="lg" />
        </div>
      </section>

      {/* 2. EVIDENCE CHIPS & EVIDENCE-MIX BAR */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">2. Evidence Chips & Segmented Evidence-Mix Bar</h2>
        <p className="text-xs text-ink-muted">
          Never flattering percentages. Transparently reflects self-reported vs witnessed claims.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <EvidenceChip grade="PATIENT_REPORTED" />
          <EvidenceChip grade="CAREGIVER_WITNESSED" />
          <EvidenceChip grade="CLINICIAN_RECORDED" />
          <EvidenceChip grade="DEVICE_RECORDED" />
          <EvidenceChip grade="UNKNOWN" />
        </div>
        <EvidenceMixBar />
      </section>

      {/* 3. HOLD TO CONFIRM GESTURE */}
      <section className="space-y-4 max-w-md">
        <h2 className="text-xl font-bold text-ink">3. Hold-to-Confirm (~600ms) with Spring & Fallback</h2>
        <p className="text-xs text-ink-muted">
          Prevents accidental button taps. Includes fallback for keyboard and switch access.
        </p>
        <HoldToConfirmButton
          onConfirmed={() => setDemoConfirmed(true)}
          label="Press & Hold 600ms to Mark Taken"
        />
        {demoConfirmed && (
          <p className="text-xs text-[#1E7A45] font-bold">
            ✓ Confirmed! 10-minute undo toast with draining ring is now visible.
          </p>
        )}
      </section>

      {/* 4. 24-HOUR DAY RING */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">4. 24-Hour Circular Day Ring</h2>
        <DayRing slots={slots} onSelectSlot={(s) => alert(`Selected slot: ${s.brandName} at ${s.dueTime}`)} />
      </section>

      {/* 5. CARE CIRCLE PRESENCE & BREATHING RING */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">5. Care Circle Presence & On-Call Breathing Ring</h2>
        <CareCirclePresence />
      </section>

      {/* 6. ESCALATION LADDER */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">6. Multi-Tier Escalation Ladder</h2>
        <EscalationLadder />
      </section>

      {/* 7. ACCESS LEDGER */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">7. DPDP Access Ledger & One-Tap Pause</h2>
        <AccessLedgerView />
      </section>

      {/* 8. ELDER PIN KEYPAD */}
      <section className="space-y-4 max-w-sm">
        <h2 className="text-xl font-bold text-ink">8. High-Accessibility Elder PIN Keypad</h2>
        <ElderPinKeypad onSuccess={() => alert('PIN Verified (1234)!')} />
      </section>
    </div>
  );
};
