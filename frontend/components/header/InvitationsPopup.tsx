"use client";

import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { useInvitationStore, EnhancedInvitation } from "@/lib/stores/invitationStore";

export default function InvitationsPopup() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Use the invitation store
  const {
    invitations,
    enhancedInvitations,
    isLoading,
    isRefreshing,
    fetchInvitations,
    enhanceInvitations,
    respondToInvite,
    getPendingInvitations
  } = useInvitationStore();

  useEffect(() => {
    // Add click outside listener to close dropdown
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Effect to fetch fresh invitations when the popup opens
  useEffect(() => {
    if (open) {
      fetchInvitations();
    }
  }, [open, fetchInvitations]);

  // Effect to enhance invitations when they change
  useEffect(() => {
    if (open && invitations.length > 0) {
      enhanceInvitations();
    }
  }, [open, invitations, enhanceInvitations]);

  const handleResponse = async (invitationId: string, accept: boolean) => {
    try {
      await respondToInvite(invitationId, accept);
      toast({
        title: accept ? "Invitation Accepted" : "Invitation Declined",
        description: accept 
          ? "You have accepted the invitation to join the contest." 
          : "You have declined the invitation to join the contest.",
      });
    } catch (error) {
      console.error("Error responding to invitation:", error);
      toast({
        title: "Error",
        description: "There was an error processing your response to the invitation.",
        variant: "destructive",
      });
    }
  };

  const pendingInvitations = getPendingInvitations();
  const hasPendingInvitations = pendingInvitations.length > 0;

  const toggleOpen = () => setOpen(!open);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button 
        className="relative flex items-center justify-center h-8 w-8 rounded-full hover:bg-primary-foreground/10"
        onClick={toggleOpen}
      >
        <Bell className="h-5 w-5" />
        {hasPendingInvitations && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {pendingInvitations.length}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-background border z-50 overflow-hidden">
          <div className="py-2 px-3 border-b flex justify-between items-center">
            <h3 className="font-medium">Invitations</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchInvitations} 
              disabled={isLoading || isRefreshing}
              className="h-7 px-2 text-xs"
            >
              Refresh
            </Button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {enhancedInvitations.length === 0 ? (
              <div className="py-4 text-center">No invitations found</div>
            ) : (
              <div className="divide-y">
                {enhancedInvitations.map((invitation) => (
                  <div 
                    key={invitation.id} 
                    className="p-3 hover:bg-muted/50"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">
                          {invitation.contestDetails?.title || 
                          (invitation.contest?.title && invitation.contest.title) || 
                          "Unknown Contest"}
                        </h4>
                        <div className="text-xs">
                          {invitation.status === 'pending' ? (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900 dark:text-yellow-100">
                              Pending
                            </span>
                          ) : invitation.status === 'accepted' ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-100">
                              Accepted
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-100">
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <p>From: {invitation.inviterDetails?.name || 
                                  invitation.inviterDetails?.login || 
                                  invitation.user?.name || 
                                  invitation.userEmail || 
                                  "Unknown"}
                        </p>
                        <p className="mt-0.5">{formatDate(invitation.invitedAt || invitation.createdAt)}</p>
                      </div>
                      
                      {invitation.contestDetails && (
                        <div className="text-xs mt-1">
                          <p><strong>Period:</strong> {formatDate(invitation.contestDetails.startDate)} - {formatDate(invitation.contestDetails.endDate)}</p>
                          <p className="line-clamp-2 text-muted-foreground mt-1">
                            {invitation.contestDetails.description}
                          </p>
                        </div>
                      )}
                      
                      {invitation.status === 'pending' && (
                        <div className="flex gap-2 justify-end mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleResponse(invitation.id, false)}
                          >
                            Decline
                          </Button>
                          <Button 
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleResponse(invitation.id, true)}
                          >
                            Accept
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 