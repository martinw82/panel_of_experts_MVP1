import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

export interface ToastProps {
  id: string; title?: string; description?: string;
  variant?: 'default' | 'destructive' | 'success'; onClose?: () => void;
}

export function Toast({ id, title, description, variant = 'default', onClose }: ToastProps) {
  React.useEffect(() => { const t = setTimeout(() => onClose?.(), 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={cn("group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all", {
      "border-border bg-background text-foreground": variant === 'default',
      "border-destructive/50 bg-destructive text-destructive-foreground": variant === 'destructive',
      "border-green-500/50 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100": variant === 'success'
    })}>
      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      <Button variant="ghost" size="icon" className={cn("absolute right-2 top-2 h-6 w-6 rounded-md p-0 opacity-0 transition-opacity group-hover:opacity-100")} onClick={onClose}><X className="h-4 w-4" /></Button>
    </div>
  )
}

export function Toaster({ toasts, onDismiss }: { toasts: ToastProps[], onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => <Toast key={toast.id} {...toast} onClose={() => onDismiss(toast.id)} />)}
    </div>
  )
}
