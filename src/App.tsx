import { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { PublicLayout } from './components/Layout';
import { DnaLoader } from './components/DnaSymbol';
import Home from './pages/Home';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Publications from './pages/Publications';
import PublicationDetail from './pages/PublicationDetail';
import { CongressesLayout, CongressTimeline } from './pages/Congresses';
import { CongressDetail, Gallery, PosterDetail, PosterGrid } from './pages/CongressPages';
import About from './pages/About';
import { Confirm, Privacy, Unsubscribe } from './pages/Newsletter';
import NotFound from './pages/NotFound';

// El panel se descarga solo cuando un editor entra (no pesa en el sitio público).
const AdminApp = lazy(() => import('./admin/AdminApp'));
const Login = lazy(() => import('./admin/Login'));

export default function App() {
  return (
    <Suspense fallback={<DnaLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="articulos" element={<Articles />} />
          <Route path="articulos/:slug" element={<ArticleDetail />} />
          <Route path="cursos" element={<Courses />} />
          <Route path="cursos/:slug" element={<CourseDetail />} />
          <Route path="publicaciones" element={<Publications />} />
          <Route path="publicaciones/:slug" element={<PublicationDetail />} />
          <Route path="congresos" element={<CongressesLayout />}>
            <Route index element={<CongressTimeline />} />
            <Route path="disertaciones/*" element={<Navigate to="/congresos" replace />} />
            <Route path="posteres" element={<PosterGrid />} />
            <Route path="posteres/:slug" element={<PosterDetail />} />
            <Route path="galeria" element={<Gallery />} />
            <Route path=":slug" element={<CongressDetail />} />
          </Route>
          <Route path="quienes-somos" element={<About />} />
          <Route path="privacidad" element={<Privacy />} />
          <Route path="newsletter/confirmar" element={<Confirm />} />
          <Route path="newsletter/baja" element={<Unsubscribe />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="editores" element={<Login />} />
        <Route path="admin/*" element={<AdminApp />} />
      </Routes>
    </Suspense>
  );
}
