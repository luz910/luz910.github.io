import { Link } from 'react-router-dom';
export default function NotFoundAdmin() {
  return <div className="py-16 text-center"><p className="font-semibold">Sección no encontrada</p><Link to="/admin" className="link mt-2 inline-block">Volver al resumen</Link></div>;
}
