import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import RenderErrorBoundary from './components/RenderErrorBoundary';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Candidates = lazy(() => import('./pages/Candidates'));
const CandidateDetail = lazy(() => import('./pages/CandidateDetail'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Pipeline = lazy(() => import('./pages/Pipeline'));

function PageLoading() {
  return <p role="status">Loading page…</p>;
}

function Guard() {
  const { user, ready } = useAuth();

  if (!ready) return <p>Checking your session…</p>;
  return user ? <AppLayout /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <RenderErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Guard />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/candidates" element={<Candidates />} />
              <Route path="/candidates/:id" element={<CandidateDetail />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/pipeline" element={<Pipeline />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </RenderErrorBoundary>
  );
}
