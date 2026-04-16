'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import Spinner from '@/components/Spinner'

interface Props {
  userId: string
  userEmail: string | undefined
}

export default function DeleteUserButton({ userId, userEmail }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to delete user')
      setLoading(false)
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label="Delete user"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{userEmail ?? userId}</span>
              {' '}will be permanently deleted along with all their data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="gap-2">
              {loading ? <Spinner size={14} strokeColor="currentColor" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
