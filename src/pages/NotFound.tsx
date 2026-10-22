import { Link } from 'react-router-dom';
import { DnaSymbol } from '../components/DnaSymbol';
import { Seo } from '../components/Seo';
export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <Seo title="Página no encontrada" noindex />
      <DnaSymbol className="h-28 w-auto" />
      <h1 className="h-display mt-6 text-4xl">No encontramos esta página</h1>
      <p className="mt-3 text-ink-soft">Puede que el contenido haya cambiado de dirección o ya no esté publicado.</p>
      <Link to="/" className="btn-primary mt-8">Volver al inicio</Link>
    </div>
  );
}
