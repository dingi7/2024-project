'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { UserPlusIcon, CheckIcon, XIcon } from 'lucide-react';
import { Invitation } from '@/lib/types';
import { createInvitation, getContestInvitations, getUserInvitations, respondToInvitation, cancelInvitation } from '@/app/api/requests';

interface InvitationManagerProps {
  contestId: string;
  isOwner: boolean;
}

export default function InvitationManager({ contestId, isOwner }: InvitationManagerProps) {
  const { data: session } = useSession();
  const [userEmail, setUserEmail] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [userInvitations, setUserInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!contestId || !session?.user?.id) return;
    const fetchInvitations = async () => {
      setIsLoading(true);
      try {
        if (isOwner) {
          const response = await getContestInvitations(contestId);
          setInvitations(response);
        } else {
          const response = await getUserInvitations();
          setUserInvitations(response.filter((inv: Invitation) => inv.contestID === contestId || inv.status === 'pending'));
        }
      } catch (error) {
        console.error('Failed to fetch invitations:', error);
        toast({
          title: 'Failed to fetch invitations',
          description: 'An error occurred while fetching invitations.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvitations();
  }, [contestId, session?.user?.id, isOwner]);

  const handleInvite = async () => {
    if (!userEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter a user email to invite.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!contestId) {
      toast({
        title: 'Error',
        description: 'Contest ID is missing.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await createInvitation(contestId, { userEmail: userEmail });
      toast({
        title: 'Invitation sent',
        description: 'The invitation was sent successfully.',
        variant: 'success',
      });
      const response = await getContestInvitations(contestId);
      setInvitations(response);
      setUserEmail('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast({
        title: 'Failed to send invitation',
        description: 'An error occurred while sending the invitation.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (invitationId: string, accept: boolean) => {
    setIsLoading(true);
    try {
      await respondToInvitation(invitationId, { accept: accept });
      setUserInvitations(prev => prev.map(inv => inv.id === invitationId ? { ...inv, status: accept ? 'accepted' : 'rejected' } : inv));
      toast({
        title: accept ? 'Invitation accepted' : 'Invitation declined',
        description: accept ? 'You have accepted the invitation.' : 'You have declined the invitation.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
      toast({
        title: 'Failed to respond',
        description: 'An error occurred while responding to the invitation.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (invitationId: string) => {
    setIsLoading(true);
    try {
      await cancelInvitation(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      toast({
        title: 'Invitation cancelled',
        description: 'The invitation was cancelled.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      toast({
        title: 'Failed to cancel invitation',
        description: 'An error occurred while cancelling the invitation.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isOwner) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Invitations</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <UserPlusIcon className="h-4 w-4" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite User by Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="userEmail" className="text-sm font-medium">
                    User Email
                  </label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="Enter user email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleInvite} 
                  disabled={isLoading || !userEmail.trim()}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {invitations.length > 0 ? (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">
                      {invitation.user?.name || invitation.userEmail}
                    </CardTitle>
                    <Badge variant={invitation.status === 'pending' ? 'outline' : invitation.status === 'accepted' ? 'success' : 'destructive'}>
                      {invitation.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {invitation.user?.email || invitation.userEmail || ''}
                  </CardDescription>
                </CardHeader>
                {invitation.status === 'pending' && (
                  <CardFooter className="pt-2 pb-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs" 
                      onClick={() => handleCancel(invitation.id)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No invitations sent yet.</p>
        )}
      </div>
    );
  } else {
    const pendingInvitations = userInvitations.filter(inv => inv.status === 'pending');
    if (pendingInvitations.length === 0) {
      return null;
    }
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pending Invitations</h3>
        <div className="space-y-3">
          {pendingInvitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {invitation.contest?.title || 'Contest Invitation'}
                </CardTitle>
                <CardDescription>
                  Invited by: {invitation.user?.name || 'Contest Owner'}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRespond(invitation.id, false)}
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <XIcon className="h-4 w-4" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRespond(invitation.id, true)}
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <CheckIcon className="h-4 w-4" />
                  Accept
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }
}