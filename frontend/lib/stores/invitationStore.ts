import { create } from 'zustand';
import { Invitation, Contest } from '@/lib/types';
import { 
  getUserInvitations, 
  getContestById, 
  getGithubUserInfoById,
  respondToInvitation
} from '@/app/api/requests';

// Enhanced invitation interface to include additional fields from the API response
export interface EnhancedInvitation extends Invitation {
  contestDetails?: Contest;
  inviterDetails?: {
    name?: string;
    login?: string;
    avatar_url?: string;
  };
  // Additional fields from the API that aren't in the original Invitation type
  invitedBy?: string;
  invitedAt?: string;
  contestId?: string; // Some APIs use contestId instead of contestID
}

interface InvitationState {
  // State
  invitations: EnhancedInvitation[];
  enhancedInvitations: EnhancedInvitation[];
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Actions
  fetchInvitations: () => Promise<void>;
  enhanceInvitations: () => Promise<void>;
  respondToInvite: (invitationId: string, accept: boolean) => Promise<void>;
  
  // Helper method
  getPendingInvitations: () => EnhancedInvitation[];
}

export const useInvitationStore = create<InvitationState>((set, get) => ({
  invitations: [],
  enhancedInvitations: [],
  isLoading: false,
  isRefreshing: false,
  
  fetchInvitations: async () => {
    try {
      set({ isLoading: true });
      const response = await getUserInvitations();
      const newInvitations = response || [];
      
      // Only update if there are differences
      if (haveInvitationsChanged(get().invitations, newInvitations)) {
        set({ invitations: newInvitations });
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  enhanceInvitations: async () => {
    const { invitations } = get();
    if (!invitations.length) return;
    
    try {
      set({ isRefreshing: true });
      
      // Fetch additional details for each invitation
      const enhanced = await Promise.all(
        invitations.map(fetchInvitationDetails)
      );
      
      set({ enhancedInvitations: enhanced });
    } catch (error) {
      console.error('Error enhancing invitations:', error);
    } finally {
      set({ isRefreshing: false });
    }
  },
  
  respondToInvite: async (invitationId: string, accept: boolean) => {
    try {
      await respondToInvitation(invitationId, { accept });
      // Update the list after responding
      get().fetchInvitations();
      return Promise.resolve();
    } catch (error) {
      console.error('Error responding to invitation:', error);
      return Promise.reject(error);
    }
  },
  
  getPendingInvitations: () => {
    return get().invitations.filter(inv => inv.status === 'pending');
  }
}));

// Helper function to fetch details for a single invitation
const fetchInvitationDetails = async (invitation: EnhancedInvitation): Promise<EnhancedInvitation> => {
  const enhancedInvitation: EnhancedInvitation = { ...invitation };
  
  try {
    // Get contest details
    const contestId = invitation.contestID || invitation.contestId;
    if (contestId) {
      const contestResponse = await getContestById(contestId);
      if (contestResponse) {
        enhancedInvitation.contestDetails = contestResponse;
      }
    }
    
    // Get inviter details
    if (invitation.invitedBy) {
      const inviterResponse = await getGithubUserInfoById(invitation.invitedBy);
      enhancedInvitation.inviterDetails = inviterResponse;
    }
  } catch (error) {
    console.error("Error fetching invitation details:", error);
  }
  
  return enhancedInvitation;
};

// Function to check if invitations have changed
const haveInvitationsChanged = (oldInvitations: EnhancedInvitation[], newInvitations: EnhancedInvitation[]) => {
  if (oldInvitations.length !== newInvitations.length) return true;
  
  // Create maps of invitation IDs to their status for both arrays
  const oldMap = new Map(oldInvitations.map(inv => [inv.id, inv.status]));
  
  // Check if any invitation in the new array has a different status
  return newInvitations.some(inv => oldMap.get(inv.id) !== inv.status);
}; 