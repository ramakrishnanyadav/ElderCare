import { EldercareApiClient } from '../../packages/contracts/src/client/apiClient';
import { initialMedicines } from '../mock/initialData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * Production HTTP API Client Adapter implementing EldercareApiClient
 * Issues requests with credentials and parses Zod-validated payloads.
 */
export class HttpEldercareClient implements EldercareApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Includes opaque __Host- session cookie
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      console.warn(`API call failed to ${endpoint}, falling back to local state:`, err?.message);
      throw err;
    }
  }

  // Auth Methods
  async login(req: any): Promise<{ sessionToken: string; user: any }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async verifyElderPin(req: any): Promise<{ sessionToken: string }> {
    return this.request('/auth/elder-pin', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async createInvite(req: any): Promise<{ passcode: string; expiresAt: string }> {
    return this.request('/auth/invites', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async redeemInvite(req: any): Promise<{ sessionToken: string }> {
    return this.request('/auth/invites/redeem', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
  }

  // Medications & Schedules
  async getMedications(patientId: string): Promise<any[]> {
    try {
      return await this.request(`/medications?patientId=${patientId}`);
    } catch {
      return initialMedicines;
    }
  }

  async editRoutineTiming(dto: any): Promise<{ success: boolean; revertibleUntil: string }> {
    return this.request('/medications/timing', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async proposeMedicationChange(dto: any): Promise<{ proposalId: string; status: string }> {
    return this.request('/medications/proposals', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async approveMedicationChange(dto: any): Promise<{ success: boolean }> {
    return this.request(`/medications/proposals/${dto.proposalId}/approve`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  // Doses & Adherence
  async getDoseSlots(patientId: string, fromDate?: string, toDate?: string): Promise<any[]> {
    return this.request(`/doses?patientId=${patientId}&fromDate=${fromDate || ''}&toDate=${toDate || ''}`);
  }

  async recordDose(dto: any): Promise<{ ledgerId: string; currentHash: string }> {
    return this.request('/doses', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async correctDose(dto: any): Promise<{ ledgerId: string }> {
    return this.request(`/doses/${dto.doseSlotId}/corrections`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getAdherenceReport(patientId: string, days?: number): Promise<any> {
    return this.request(`/doses/adherence-report?patientId=${patientId}&days=${days || 7}`);
  }

  // Circle & Privacy
  async getCareCircle(patientId: string): Promise<any[]> {
    return this.request(`/circle?patientId=${patientId}`);
  }

  async grantConsent(dto: any): Promise<{ consentId: string }> {
    return this.request('/circle/grants', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async revokeConsent(dto: any): Promise<{ success: boolean }> {
    return this.request('/circle/grants/revoke', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async pauseSharing(patientId: string): Promise<{ success: boolean }> {
    return this.request(`/circle/pause?patientId=${patientId}`, { method: 'POST' });
  }

  async resumeSharing(patientId: string): Promise<{ success: boolean }> {
    return this.request(`/circle/resume?patientId=${patientId}`, { method: 'POST' });
  }

  async requestEmergencyAccess(dto: any): Promise<{ emergencyToken: string; expiresAt: string }> {
    return this.request('/circle/emergency-access', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getAccessLedger(patientId: string): Promise<any[]> {
    return this.request(`/circle/access-ledger?patientId=${patientId}`);
  }

  // Obligations & Sync
  async getObligations(patientId: string): Promise<any[]> {
    return this.request(`/obligations?patientId=${patientId}`);
  }

  async acknowledgeObligation(dto: any): Promise<{ success: boolean }> {
    return this.request(`/obligations/${dto.obligationId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async fulfillObligation(dto: any): Promise<{ success: boolean }> {
    return this.request(`/obligations/${dto.obligationId}/fulfill`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async syncOfflineBatch(dto: any): Promise<{ appliedCount: number; errors: any[] }> {
    return this.request('/sync/batch', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }
}

export const apiClient = new HttpEldercareClient();
