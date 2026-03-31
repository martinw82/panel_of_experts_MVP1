import { useState, useCallback } from 'react';
export interface Toast { id: string; title?: string; description?: string; variant?: 'default' | 'destructive' | 'success'; duration?: number; }
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, description, variant, duration }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    return { id };
  }, []);
  const dismiss = useCallback((toastId?: string) => { setToasts(prev => toastId ? prev.filter(t => t.id !== toastId) : []); }, []);
  return { toast, dismiss, toasts };
}
