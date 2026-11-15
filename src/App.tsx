import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserStore } from './store/userStore';
import { listenToAuthChanges } from './firebase/authService';
import { Header } from './components/common/Header';
import { StalenessBanner } from './components/common/StalenessBanner';
import { Toast } from './components/common/Toast';
import { TimeTravelDemoControl } from './components/common/TimeTravelDemoControl';

// Pages
import { OnboardingPage } from './pages/OnboardingPage';
import { AuthPage } from './pages/AuthPage';
import { ComponentKitPage } from './pages/ComponentKitPage';
import { ElderHomePage } from './pages/elder/ElderHomePage';
import { ElderTodayPage } from './pages/elder/ElderTodayPage';
import { ElderAppointmentsPage } from './pages/elder/ElderAppointmentsPage';
import { ElderCirclePage } from './pages/elder/ElderCirclePage';
import { ElderHelpPage } from './pages/elder/ElderHelpPage';

import { FamilyDashboardPage } from './pages/family/FamilyDashboardPage';
import { FamilyMedicinesPage } from './pages/family/FamilyMedicinesPage';
import { FamilyObligationsPage } from './pages/family/FamilyObligationsPage';
import { FamilyAppointmentsPage } from './pages/family/FamilyAppointmentsPage';
import { FamilyCirclePage } from './pages/family/FamilyCirclePage';
import { FamilyWeeklyReportPage } from './pages/family/FamilyWeeklyReportPage';

import { CaregiverTasksPage } from './pages/caregiver/CaregiverTasksPage';
import { CaregiverHandoverPage } from './pages/caregiver/CaregiverHandoverPage';

const queryClient = new QueryClient();

// Dynamic Home Router based on active experience mode
const DynamicHome: React.FC = () => {
  const experienceMode = useUserStore((s) => s.experienceMode);
  if (experienceMode === 'elder') return <ElderHomePage />;
  if (experienceMode === 'caregiver') return <CaregiverTasksPage />;
  return <FamilyDashboardPage />;
};

// Sub-nav or bottom navigation bar
const BottomNavBar: React.FC = () => {
  const location = useLocation();
  const experienceMode = useUserStore((s) => s.experienceMode);

  if (location.pathname === '/onboarding' || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/kit') {
    return null;
  }

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-md border-t border-hairline py-2 px-3 shadow-lg"
    >
      <div className="max-w-md mx-auto flex items-center justify-around text-xs font-semibold">
        {experienceMode === 'elder' ? (
          <>
            <Link
              to="/"
              className={`flex flex-col items-center py-1.5 px-3 rounded-full transition-colors ${
                location.pathname === '/' ? 'text-teal-900 bg-teal-50' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="text-xl" aria-hidden="true">⭕</span>
              <span>Day Ring</span>
            </Link>
            <Link
              to="/today"
              className={`flex flex-col items-center py-1.5 px-3 rounded-full transition-colors ${
                location.pathname === '/today' ? 'text-teal-900 bg-teal-50' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="text-xl" aria-hidden="true">💊</span>
              <span>Medicines</span>
            </Link>
            <Link
              to="/help"
              className={`flex flex-col items-center py-1.5 px-3 rounded-full transition-colors ${
                location.pathname === '/help' ? 'text-rose-900 bg-rose-50' : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              <span className="text-xl" aria-hidden="true">📞</span>
              <span>Help</span>
            </Link>
          </>
        ) : experienceMode === 'caregiver' ? (
          <>
            <Link
              to="/"
              className={`flex flex-col items-center py-1.5 px-4 rounded-full transition-colors ${
                location.pathname === '/' ? 'text-teal-900 bg-teal-50' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="text-lg" aria-hidden="true">📋</span>
              <span>Today Tasks</span>
            </Link>
            <Link
              to="/handover"
              className={`flex flex-col items-center py-1.5 px-4 rounded-full transition-colors ${
                location.pathname === '/handover' ? 'text-teal-900 bg-teal-50' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="text-lg" aria-hidden="true">📝</span>
              <span>Handover Notes</span>
            </Link>
            <Link
              to="/circle"
              className={`flex flex-col items-center py-1.5 px-4 rounded-full transition-colors ${
                location.pathname === '/circle' ? 'text-teal-900 bg-teal-50' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="text-lg" aria-hidden="true">👥</span>
              <span>Care Circle</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/"
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-full transition-colors ${
                location.pathname === '/' ? 'text-teal-900 bg-teal-50' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="text-base" aria-hidden="true">📊</span>
              <span>Dashboard</span>
            </Link>
            <Link
              to="/medicines"
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-full transition-colors ${
                location.pathname === '/medicines' ? 'text-teal-900 bg-teal-50' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="text-base" aria-hidden="true">💊</span>
              <span>Meds</span>
            </Link>
            <Link
              to="/obligations"
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-full transition-colors ${
                location.pathname === '/obligations' ? 'text-teal-900 bg-teal-50' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="text-base" aria-hidden="true">⚡</span>
              <span>Obligations</span>
            </Link>
            <Link
              to="/circle"
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-full transition-colors ${
                location.pathname === '/circle' ? 'text-teal-900 bg-teal-50' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="text-base" aria-hidden="true">🛡️</span>
              <span>Ledger</span>
            </Link>
            <Link
              to="/report"
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-full transition-colors ${
                location.pathname === '/report' ? 'text-teal-900 bg-teal-50' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span className="text-base" aria-hidden="true">📈</span>
              <span>Report</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export const App: React.FC = () => {
  const experienceMode = useUserStore((s) => s.experienceMode);
  const setFirebaseProfile = useUserStore((s) => s.setFirebaseProfile);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', experienceMode);
  }, [experienceMode]);

  // Firebase Auth Real-time Listener & Profile Sync
  useEffect(() => {
    const unsubscribe = listenToAuthChanges((profile) => {
      if (profile) {
        setFirebaseProfile(profile);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [setFirebaseProfile]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen flex flex-col bg-canvas text-ink pb-20">
          <Header />
          <StalenessBanner />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
            <Routes>
              <Route path="/" element={<DynamicHome />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />
              <Route path="/kit" element={<ComponentKitPage />} />
              
              {/* Elder Routes */}
              <Route path="/today" element={<ElderTodayPage />} />
              <Route path="/help" element={<ElderHelpPage />} />

              {/* Family Routes */}
              <Route path="/medicines" element={<FamilyMedicinesPage />} />
              <Route path="/obligations" element={<FamilyObligationsPage />} />
              <Route path="/appointments" element={<FamilyAppointmentsPage />} />
              <Route path="/circle" element={<FamilyCirclePage />} />
              <Route path="/report" element={<FamilyWeeklyReportPage />} />

              {/* Caregiver Routes */}
              <Route path="/tasks" element={<CaregiverTasksPage />} />
              <Route path="/handover" element={<CaregiverHandoverPage />} />
            </Routes>
          </main>

          <BottomNavBar />
          <Toast />
          <TimeTravelDemoControl />
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
