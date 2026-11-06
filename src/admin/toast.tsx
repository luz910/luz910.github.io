import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface Toast { id: number; kind: 'ok' | 'error'; text: string }
const Ctx = createContext<{ ok: (t: string) => void; error: (t: string) => void }>({ ok: () => {}, error: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, kind, text }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), kind === 'error' ? 9000 : 2200);
  }, []);
  const api = { ok: (t: string) => push('ok', t), error: (t: string) => push('error', t) };
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-xl p-4 text-sm shadow-lg ${t.kind === 'ok' ? 'bg-ink text-white' : 'bg-red-700 text-white'}`}>
            {t.kind === 'ok' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-300" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            <p className="flex-1">{t.text}</p>
            <button aria-label="Cerrar aviso" onClick={() => setList((l) => l.filter((x) => x.id !== t.id))}><X className="h-4 w-4 opacity-70" /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);

/** Diálogo de confirmación accesible (reemplaza a window.confirm). */
export function ConfirmDialog({ open, title, text, confirmLabel = 'Eliminar', danger = true, onConfirm, onCancel }: { open: boolean; title: string; text?: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="confirm-title" className="text-lg font-bold text-ink">{title}</h2>
        {text && <p className="mt-2 text-sm text-ink-soft">{text}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel} autoFocus>Cancelar</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
