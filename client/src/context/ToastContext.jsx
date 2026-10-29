import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback(id => setToasts(items => items.filter(item => item.id !== id)), []);
  const toast = useCallback((message, type = 'success') => { const id = `${Date.now()}-${Math.random()}`; setToasts(items => [...items, { id, message, type }]); setTimeout(() => dismiss(id), 4200); }, [dismiss]);
  const Icon = ({ type }) => type === 'error' ? <AlertCircle size={18}/> : type === 'info' ? <Info size={18}/> : <CheckCircle2 size={18}/>;
  return <ToastContext.Provider value={toast}>{children}<div className="toast-stack" aria-live="polite">{toasts.map(item => <div key={item.id} className={`app-toast toast-${item.type}`}><Icon type={item.type}/><span>{item.message}</span><button aria-label="Dismiss notification" onClick={() => dismiss(item.id)}><X size={15}/></button></div>)}</div></ToastContext.Provider>;
}
export function useToast() { return useContext(ToastContext); }
