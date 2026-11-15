import { create } from 'zustand';
import {
  Medicine,
  DoseSlot,
  Appointment,
  Obligation,
  EscalationStep,
  CareCircleMember,
  AccessLogEntry,
  EvidenceGrade,
} from '../types';
import {
  initialMedicines,
  initialSlots,
  initialAppointments,
  initialObligations,
  initialEscalationSteps,
  initialCareCircle,
  initialAccessLogs,
} from '../mock/initialData';

interface ToastState {
  id: string;
  title: string;
  subtitle?: string;
  undoAction?: () => void;
  expiresAt: number;
}

interface MockStoreState {
  medicines: Medicine[];
  slots: DoseSlot[];
  appointments: Appointment[];
  obligations: Obligation[];
  escalationSteps: EscalationStep[];
  careCircle: CareCircleMember[];
  accessLogs: AccessLogEntry[];
  sharingPaused: boolean;
  offlineQueue: { type: string; payload: any; timestamp: number }[];
  activeToast: ToastState | null;

  // Actions
  markDoseTaken: (slotId: string, grade?: EvidenceGrade, actor?: string) => Promise<boolean>;
  undoDose: (slotId: string) => void;
  markDoseSkipped: (slotId: string, reason: string) => void;
  updateMedicineTiming: (medId: string, newTime: string) => void;
  proposeMedicineChange: (
    appointmentId: string,
    proposal: {
      brandName: string;
      changeType: 'DOSE_CHANGE' | 'NEW_MED' | 'DISCONTINUE';
      currentDosage?: string;
      proposedDosage: string;
      proposerName: string;
      proposerId: string;
    }
  ) => void;
  approveMedicineChange: (appointmentId: string, proposalId: string, approverId: string, approverName: string) => boolean;
  rejectMedicineChange: (appointmentId: string, proposalId: string) => void;
  acknowledgeObligation: (obligationId: string) => void;
  fulfillObligation: (obligationId: string, note?: string) => void;
  toggleSharingPause: () => void;
  addHandoverNote: (note: string, author: string) => void;
  clearToast: () => void;
}

export const useMockStore = create<MockStoreState>((set, get) => ({
  medicines: initialMedicines,
  slots: initialSlots,
  appointments: initialAppointments,
  obligations: initialObligations,
  escalationSteps: initialEscalationSteps,
  careCircle: initialCareCircle,
  accessLogs: initialAccessLogs,
  sharingPaused: false,
  offlineQueue: [],
  activeToast: null,

  markDoseTaken: async (slotId, grade = 'PATIENT_REPORTED', actor = 'Dhyanchand Sharma') => {
    const prevSlots = get().slots;
    const target = prevSlots.find((s) => s.id === slotId);
    if (!target) return false;

    // Optimistic Update (<100ms)
    const undoExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    const updatedSlots = prevSlots.map((s) =>
      s.id === slotId
        ? {
            ...s,
            status: 'TAKEN' as const,
            evidenceGrade: grade,
            actorName: actor,
            recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            undoExpiresAt: undoExpires,
          }
        : s
    );

    const newLog: AccessLogEntry = {
      id: `log-${Date.now()}`,
      actorName: actor,
      actorRole: grade === 'PATIENT_REPORTED' ? 'Elder' : 'Caregiver',
      actionSummary: `Recorded intake for ${target.brandName} (${grade})`,
      timestampText: 'Just now',
      rawTimestamp: Date.now(),
    };

    set({
      slots: updatedSlots,
      accessLogs: [newLog, ...get().accessLogs],
      activeToast: {
        id: `toast-${slotId}`,
        title: `${target.brandName} marked as Taken`,
        subtitle: `Evidence: ${grade === 'PATIENT_REPORTED' ? 'Self-reported' : 'Witnessed'}`,
        undoAction: () => get().undoDose(slotId),
        expiresAt: undoExpires,
      },
    });

    // Settle escalation ladder if this slot was escalated
    if (slotId === 'slot-1') {
      const settledLadder = get().escalationSteps.map((step) =>
        step.tier <= 2 ? { ...step, status: 'ACKNOWLEDGED' as const } : step
      );
      set({ escalationSteps: settledLadder });
    }

    return true;
  },

  undoDose: (slotId) => {
    const updated = get().slots.map((s) =>
      s.id === slotId ? { ...s, status: 'DUE' as const, evidenceGrade: undefined, recordedAt: undefined } : s
    );
    set({
      slots: updated,
      activeToast: null,
      accessLogs: [
        {
          id: `log-${Date.now()}`,
          actorName: 'Dhyanchand Sharma',
          actorRole: 'Elder',
          actionSummary: 'Undid intake confirmation for morning medicine',
          timestampText: 'Just now',
          rawTimestamp: Date.now(),
        },
        ...get().accessLogs,
      ],
    });
  },

  markDoseSkipped: (slotId, reason) => {
    const updated = get().slots.map((s) =>
      s.id === slotId ? { ...s, status: 'SKIPPED' as const, reason } : s
    );
    set({
      slots: updated,
      accessLogs: [
        {
          id: `log-${Date.now()}`,
          actorName: 'Dhyanchand Sharma',
          actorRole: 'Elder',
          actionSummary: `Marked dose skipped (${reason})`,
          timestampText: 'Just now',
          rawTimestamp: Date.now(),
        },
        ...get().accessLogs,
      ],
    });
  },

  updateMedicineTiming: (medId, newTime) => {
    const meds = get().medicines.map((m) => (m.id === medId ? { ...m, scheduleTime: newTime } : m));
    const slots = get().slots.map((s) => (s.medicineId === medId ? { ...s, dueTime: newTime } : s));
    set({
      medicines: meds,
      slots,
      activeToast: {
        id: `toast-time-${medId}`,
        title: `Schedule timing updated to ${newTime}`,
        subtitle: '24-hour undo available. Elder notified.',
        expiresAt: Date.now() + 60000,
      },
      accessLogs: [
        {
          id: `log-${Date.now()}`,
          actorName: 'Anita Sharma',
          actorRole: 'Daughter',
          actionSummary: `Updated routine schedule timing to ${newTime}`,
          timestampText: 'Just now',
          rawTimestamp: Date.now(),
        },
        ...get().accessLogs,
      ],
    });
  },

  proposeMedicineChange: (appointmentId, proposal) => {
    const appointments = get().appointments.map((apt) => {
      if (apt.id !== appointmentId) return apt;
      const existing = apt.proposedChanges || [];
      return {
        ...apt,
        proposedChanges: [
          ...existing,
          {
            id: `prop-${Date.now()}`,
            ...proposal,
            status: 'PROPOSED' as const,
          },
        ],
      };
    });
    set({ appointments });
  },

  approveMedicineChange: (appointmentId, proposalId, approverId, approverName) => {
    const appointment = get().appointments.find((a) => a.id === appointmentId);
    const proposal = appointment?.proposedChanges?.find((p) => p.id === proposalId);

    if (!proposal) return false;

    // Safety rule: Two-person rule! Approver MUST differ from proposer!
    if (proposal.proposerId === approverId) {
      alert('Safety policy: Proposer cannot approve their own clinical change. A second family member or clinician is required.');
      return false;
    }

    // Apply change to medicines list
    let updatedMeds = get().medicines;
    if (proposal.changeType === 'DOSE_CHANGE' && proposal.medicineId) {
      updatedMeds = updatedMeds.map((m) =>
        m.id === proposal.medicineId
          ? { ...m, instructions: `Updated dosage: ${proposal.proposedDosage}` }
          : m
      );
    }

    const updatedAppointments = get().appointments.map((apt) => {
      if (apt.id !== appointmentId) return apt;
      return {
        ...apt,
        proposedChanges: apt.proposedChanges?.map((p) =>
          p.id === proposalId ? { ...p, status: 'APPROVED' as const } : p
        ),
      };
    });

    set({
      medicines: updatedMeds,
      appointments: updatedAppointments,
      activeToast: {
        id: `toast-approve-${proposalId}`,
        title: `Approved: ${proposal.brandName} change`,
        subtitle: `Approved by ${approverName} (Second Approver)`,
        expiresAt: Date.now() + 10000,
      },
      accessLogs: [
        {
          id: `log-${Date.now()}`,
          actorName: approverName,
          actorRole: 'Family Approver',
          actionSummary: `Second-approved prescription change for ${proposal.brandName}`,
          timestampText: 'Just now',
          rawTimestamp: Date.now(),
        },
        ...get().accessLogs,
      ],
    });
    return true;
  },

  rejectMedicineChange: (appointmentId, proposalId) => {
    const updatedAppointments = get().appointments.map((apt) => {
      if (apt.id !== appointmentId) return apt;
      return {
        ...apt,
        proposedChanges: apt.proposedChanges?.map((p) =>
          p.id === proposalId ? { ...p, status: 'REJECTED' as const } : p
        ),
      };
    });
    set({ appointments: updatedAppointments });
  },

  acknowledgeObligation: (obligationId) => {
    const updated = get().obligations.map((ob) =>
      ob.id === obligationId ? { ...ob, status: 'ACKNOWLEDGED' as const } : ob
    );
    set({
      obligations: updated,
      accessLogs: [
        {
          id: `log-${Date.now()}`,
          actorName: 'Anita Sharma',
          actorRole: 'Daughter',
          actionSummary: 'Acknowledged care obligation',
          timestampText: 'Just now',
          rawTimestamp: Date.now(),
        },
        ...get().accessLogs,
      ],
    });
  },

  fulfillObligation: (obligationId, note) => {
    const updated = get().obligations.map((ob) =>
      ob.id === obligationId ? { ...ob, status: 'FULFILLED' as const } : ob
    );
    set({
      obligations: updated,
      activeToast: {
        id: `toast-ob-${obligationId}`,
        title: 'Obligation fulfilled and verified',
        subtitle: note || 'Closed with confirmation evidence',
        expiresAt: Date.now() + 8000,
      },
    });
  },

  toggleSharingPause: () => {
    const nextState = !get().sharingPaused;
    set({
      sharingPaused: nextState,
      accessLogs: [
        {
          id: `log-${Date.now()}`,
          actorName: 'Dhyanchand Sharma',
          actorRole: 'Elder',
          actionSummary: nextState
            ? 'Paused data sharing with all care circle accounts'
            : 'Resumed data sharing with care circle',
          timestampText: 'Just now',
          rawTimestamp: Date.now(),
        },
        ...get().accessLogs,
      ],
    });
  },

  addHandoverNote: (note, author) => {
    set({
      accessLogs: [
        {
          id: `log-${Date.now()}`,
          actorName: author,
          actorRole: 'Caregiver',
          actionSummary: `Handover Note: ${note}`,
          timestampText: 'Just now',
          rawTimestamp: Date.now(),
        },
        ...get().accessLogs,
      ],
      activeToast: {
        id: `toast-handover-${Date.now()}`,
        title: 'Handover note recorded in care ledger',
        expiresAt: Date.now() + 6000,
      },
    });
  },

  clearToast: () => set({ activeToast: null }),
}));
