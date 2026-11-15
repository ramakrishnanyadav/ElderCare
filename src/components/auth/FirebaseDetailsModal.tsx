import React, { useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { updateUserProfile, UserProfile } from '../../firebase/authService';

interface FirebaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseDetailsModal: React.FC<FirebaseDetailsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const firebaseProfile = useUserStore((s) => s.firebaseProfile);
  const setFirebaseProfile = useUserStore((s) => s.setFirebaseProfile);

  const [displayName, setDisplayName] = useState(firebaseProfile?.displayName || '');
  const [role, setRole] = useState<'elder' | 'family' | 'caregiver'>(firebaseProfile?.role || 'elder');
  const [phoneNumber, setPhoneNumber] = useState(firebaseProfile?.phoneNumber || '');
  const [emergencyContactName, setEmergencyContactName] = useState(firebaseProfile?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(firebaseProfile?.emergencyContactPhone || '');
  const [bloodGroup, setBloodGroup] = useState(firebaseProfile?.bloodGroup || '');
  const [address, setAddress] = useState(firebaseProfile?.address || '');
  const [notes, setNotes] = useState(firebaseProfile?.notes || '');

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseProfile?.uid) {
      setStatusMessage({ text: 'No active Firebase user detected.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const updates: Partial<UserProfile> = {
      displayName: displayName.trim(),
      role,
      phoneNumber: phoneNumber.trim() || null,
      emergencyContactName: emergencyContactName.trim() || null,
      emergencyContactPhone: emergencyContactPhone.trim() || null,
      bloodGroup: bloodGroup.trim() || null,
      address: address.trim() || null,
      notes: notes.trim(),
    };

    try {
      await updateUserProfile(firebaseProfile.uid, updates);
      setFirebaseProfile({
        ...firebaseProfile,
        ...updates,
      });
      setStatusMessage({ text: 'Details successfully updated in Firebase Cloud Firestore!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Failed to update Firestore document.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-card-lg border border-hairline shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
              🔥
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">Firebase Database Profile</h2>
              <p className="text-xs text-ink-muted">
                Cloud Firestore &bull; Collection: <code className="bg-canvas px-1.5 py-0.5 rounded text-teal-800 font-mono">users/{firebaseProfile?.uid || 'guest'}</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink p-2 rounded-full hover:bg-canvas transition-colors text-lg"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-card text-xs font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* User UID (Read-only) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                Firestore UID
              </label>
              <input
                type="text"
                value={firebaseProfile?.uid || 'Not authenticated'}
                disabled
                className="w-full p-2.5 rounded-card border border-hairline bg-canvas text-xs font-mono text-ink-muted"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                Auth Email
              </label>
              <input
                type="text"
                value={firebaseProfile?.email || 'N/A'}
                disabled
                className="w-full p-2.5 rounded-card border border-hairline bg-canvas text-xs font-mono text-ink-muted"
              />
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Kamala Devi"
                className="w-full p-2.5 rounded-card border border-hairline bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal-700"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                Care Circle Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full p-2.5 rounded-card border border-hairline bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                <option value="elder">👵 Elder (Primary Recipient)</option>
                <option value="family">👨‍👩‍👧 Family Member</option>
                <option value="caregiver">🩺 Designated Caregiver</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full p-2.5 rounded-card border border-hairline bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                Blood Group
              </label>
              <input
                type="text"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value.toUpperCase())}
                placeholder="e.g. B+ / O+"
                className="w-full p-2.5 rounded-card border border-hairline bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal-700 uppercase"
              />
            </div>

            {/* Emergency Contact Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="e.g. Anita Sharma (Daughter)"
                className="w-full p-2.5 rounded-card border border-hairline bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            {/* Emergency Contact Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+91 98111 22334"
                className="w-full p-2.5 rounded-card border border-hairline bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
              Residential Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. B-42 Defence Colony, New Delhi, India"
              className="w-full p-2.5 rounded-card border border-hairline bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          {/* Medical Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
              Care & Allergy Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Known allergies or special assistance preferences..."
              className="w-full p-2.5 rounded-card border border-hairline bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          {/* Raw JSON viewer */}
          <div className="pt-2">
            <details className="text-xs text-ink-muted bg-canvas p-3 rounded-card border border-hairline">
              <summary className="font-semibold cursor-pointer text-ink">
                View Raw Firestore Document JSON
              </summary>
              <pre className="mt-2 p-2 bg-slate-900 text-teal-300 rounded font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(firebaseProfile || { note: 'No Firebase user logged in' }, null, 2)}
              </pre>
            </details>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-ink-secondary hover:text-ink rounded-full border border-hairline bg-canvas hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !firebaseProfile?.uid}
              className="px-6 py-2 text-sm font-bold text-white rounded-full bg-teal-800 hover:bg-teal-900 shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving to Firestore...' : 'Update Details in Firebase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
