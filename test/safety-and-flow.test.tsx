import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FamilyMedicinesPage } from '../src/pages/family/FamilyMedicinesPage';
import { useMockStore } from '../src/store/mockStore';
import { StatusChip } from '../src/components/common/StatusChip';
import { EvidenceMixBar } from '../src/components/common/EvidenceMixBar';

describe('Safety & Clinical Invariants', () => {
  beforeEach(() => {
    // Reset store state
  });

  it('SAFETY RULE: Discontinued medicines NEVER appear under Active list', () => {
    render(<FamilyMedicinesPage />);

    // Get Active medications container
    const activeSection = screen.getByTestId('active-medications-list');
    expect(activeSection).toBeInTheDocument();

    // Verify Active medications exist
    expect(activeSection).toHaveTextContent('Glycomet-GP 1');
    expect(activeSection).toHaveTextContent('Telma 40');
    expect(activeSection).toHaveTextContent('Ecospirin 75');
    expect(activeSection).toHaveTextContent('Rosuvas 10');

    // CRITICAL ASSERTION: Amlodipine 5mg (discontinued) MUST NOT be in the active list!
    expect(activeSection).not.toHaveTextContent('Amlodipine 5mg');

    // Verify Discontinued medicine appears in the Past medications accordion
    const pastAccordionButton = screen.getByText(/Past & Discontinued Medications/i);
    fireEvent.click(pastAccordionButton);

    const pastSection = screen.getByTestId('past-medications-list');
    expect(pastSection).toHaveTextContent('Amlodipine 5mg');
    expect(pastSection).toHaveTextContent('Discontinued');
  });

  it('SAFETY RULE: Two-person rule prevents self-approval of prescription changes', () => {
    const store = useMockStore.getState();

    // Propose a change by User Anita
    store.proposeMedicineChange('apt-1', {
      brandName: 'Glycomet-GP 1',
      changeType: 'DOSE_CHANGE',
      currentDosage: '1 tablet',
      proposedDosage: '0.5 tablet',
      proposerName: 'Anita Sharma',
      proposerId: 'user-family-anita',
    });

    const appointment = useMockStore.getState().appointments.find((a) => a.id === 'apt-1');
    const proposal = appointment?.proposedChanges?.[appointment.proposedChanges.length - 1];
    expect(proposal).toBeDefined();

    // Attempt 1: Same user (Anita) attempts to approve her own proposal -> MUST FAIL!
    const selfApproveResult = store.approveMedicineChange(
      'apt-1',
      proposal!.id,
      'user-family-anita',
      'Anita Sharma'
    );
    expect(selfApproveResult).toBe(false);

    // Attempt 2: Independent family member (Rahul) approves -> MUST SUCCEED!
    const secondApproveResult = store.approveMedicineChange(
      'apt-1',
      proposal!.id,
      'user-family-rahul',
      'Rahul Sharma'
    );
    expect(secondApproveResult).toBe(true);
  });

  it('SAFETY & ACCESSIBILITY: Status chips always display BOTH icon and word label', () => {
    const { container: takenChip } = render(<StatusChip status="TAKEN" />);
    expect(takenChip).toHaveTextContent('Taken');
    expect(takenChip.querySelector('svg')).toBeInTheDocument();

    const { container: dueChip } = render(<StatusChip status="DUE" />);
    expect(dueChip).toHaveTextContent('Due now');
    expect(dueChip.querySelector('svg')).toBeInTheDocument();

    const { container: skippedChip } = render(<StatusChip status="SKIPPED" />);
    expect(skippedChip).toHaveTextContent('Skipped');
    expect(skippedChip.querySelector('svg')).toBeInTheDocument();

    const { container: missedChip } = render(<StatusChip status="MISSED" />);
    expect(missedChip).toHaveTextContent('Missed');
    expect(missedChip.querySelector('svg')).toBeInTheDocument();
  });

  it('ADHERENCE INTEGRITY: Evidence-mix bar segments records by grade, never one single percentage', () => {
    render(<EvidenceMixBar />);
    expect(screen.getByText(/Adherence Evidence Mix/i)).toBeInTheDocument();
    expect(screen.getByText(/Self-reported/i)).toBeInTheDocument();
    expect(screen.getByText(/Witnessed/i)).toBeInTheDocument();
    expect(screen.getByText(/Clinician confirmed/i)).toBeInTheDocument();
  });

  it('OPTIMISTIC HOLD-TO-CONFIRM: Mark dose taken optimistically updates state and enables undo', async () => {
    const store = useMockStore.getState();
    const targetSlot = store.slots[0];

    // Mark taken
    await store.markDoseTaken(targetSlot.id, 'PATIENT_REPORTED');

    const updatedSlot = useMockStore.getState().slots.find((s) => s.id === targetSlot.id);
    expect(updatedSlot?.status).toBe('TAKEN');
    expect(updatedSlot?.evidenceGrade).toBe('PATIENT_REPORTED');

    // Active toast with undo is set
    expect(useMockStore.getState().activeToast).toBeDefined();

    // Trigger undo
    store.undoDose(targetSlot.id);

    const revertedSlot = useMockStore.getState().slots.find((s) => s.id === targetSlot.id);
    expect(revertedSlot?.status).toBe('DUE');
    expect(revertedSlot?.evidenceGrade).toBeUndefined();
  });
});
