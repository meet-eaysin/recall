'use client';

import { useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeleteAccount } from '../hooks';
import { toast } from 'sonner';

export function DangerZone() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { mutate: deleteAccount, isPending } = useDeleteAccount();

  const handleDelete = () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    deleteAccount(undefined, {
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to delete account');
      },
    });
  };

  return (
    <>
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardFooter className="bg-destructive/10 border-t border-destructive/20 py-4">
          <Button
            variant="destructive"
            onClick={() => setIsConfirmOpen(true)}
            className="font-semibold shadow-lg shadow-destructive/20"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Delete Account?
            </DialogTitle>
            <DialogDescription className="pt-2">
              This will permanently delete your profile, documents, notes, and
              all other data. This action is **irreversible**.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-medium">
                Type <span className="font-bold text-destructive">DELETE</span>{' '}
                to confirm
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="col-span-3 border-destructive/30 focus-visible:ring-destructive"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmOpen(false);
                setConfirmText('');
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending || confirmText !== 'DELETE'}
            >
              {isPending ? 'Deleting...' : 'Permanently Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
