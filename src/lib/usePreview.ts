import { useSearchParams } from 'react-router-dom';
import { useAuth } from './auth';
/** La vista previa (borradores) solo se activa para editores con sesión iniciada. */
export function usePreview() {
  const [p] = useSearchParams();
  const { role } = useAuth();
  return p.get('preview') === '1' && !!role;
}
