import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { I18nProvider } from '@/lib/i18n';
import { lazy, Suspense } from 'react';

import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from './components/Layout';

// Eagerly loaded
import GiftCards from './pages/GiftCards';
import Events from './pages/Events';
import Home from './pages/Home';
import SubmitReview from './pages/SubmitReview';
import LoyaltyProgram from './pages/LoyaltyProgram';
import DigitalMenu from './pages/DigitalMenu';
import QRCodePrinter from './pages/QRCodePrinter';
import LoyaltyPortal from './pages/LoyaltyPortal';
import Checkout from './pages/Checkout';
import Menu from './pages/Menu';
import ContactUs from './pages/ContactUs';
import Support from './pages/Support';
import InformationSecurityPolicy from './pages/InformationSecurityPolicy';
import DataRetentionPolicy from './pages/DataRetentionPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import BookTable from './pages/BookTable';
import Careers from './pages/Careers';
import ScheduleInterview from './pages/ScheduleInterview';
import EventCenter from './pages/EventCenter';
import VendorSignup from './pages/VendorSignup';
import TapRoomSociety from './pages/TapRoomSociety';
import MyMembership from './pages/MyMembership';
import FoundersWall from './pages/FoundersWall';
import BookPrivateRoom from './pages/BookPrivateRoom';
import PitchDeck from './pages/PitchDeck';
const AdminMemberships = lazy(() => import('./pages/AdminMemberships'));
const AdminPrivateRoom = lazy(() => import('./pages/AdminPrivateRoom'));
const AdminPointsAnalytics = lazy(() => import('./pages/AdminPointsAnalytics'));

// Lazily loaded (heavy/admin pages - prevents SyntaxError from eager init)
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const VendorOverchargeAnalysis = lazy(() => import('./pages/VendorOverchargeAnalysis'));
const MileageTracking = lazy(() => import('./pages/MileageTracking'));
const PostedShifts = lazy(() => import('./pages/PostedShifts'));
const ReservationsCalendar = lazy(() => import('./pages/ReservationsCalendar'));
const EmailMarketing = lazy(() => import('./pages/EmailMarketing'));
const StaffScheduler = lazy(() => import('./pages/StaffScheduler'));
const KitchenDashboard = lazy(() => import('./pages/KitchenDashboard'));
const MenuPerformance = lazy(() => import('./pages/MenuPerformance'));
const StaffPerformance = lazy(() => import('./pages/StaffPerformance'));
const InventoryManagement = lazy(() => import('./pages/InventoryManagement'));
const KDS = lazy(() => import('./pages/KDS'));
const StaffShifts = lazy(() => import('./pages/StaffShifts'));
const ReconciliationCenter = lazy(() => import('./pages/ReconciliationCenter'));
const RevenueAnalytics = lazy(() => import('./pages/RevenueAnalytics'));
const ReservationChat = lazy(() => import('./pages/ReservationChat'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  const spinner = <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  return (
    <Suspense fallback={spinner}>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/pitch-deck" element={<PitchDeck />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/gift-cards" element={<GiftCards />} />
        <Route path="/vendor-overcharge-analysis" element={<VendorOverchargeAnalysis />} />
        <Route path="/mileage" element={<MileageTracking />} />
        <Route path="/posted-shifts" element={<PostedShifts />} />
        <Route path="/events" element={<Events />} />
        <Route path="/reservations-calendar" element={<ReservationsCalendar />} />
        <Route path="/email-marketing" element={<EmailMarketing />} />
        <Route path="/submit-review" element={<SubmitReview />} />
        <Route path="/loyalty" element={<LoyaltyProgram />} />
        <Route path="/staff-scheduler" element={<StaffScheduler />} />
        <Route path="/menu" element={<DigitalMenu />} />
        <Route path="/full-menu" element={<Menu />} />
        <Route path="/table-qr-codes" element={<QRCodePrinter />} />
        <Route path="/kitchen" element={<KitchenDashboard />} />
        <Route path="/menu-performance" element={<MenuPerformance />} />
        <Route path="/loyalty-portal" element={<LoyaltyPortal />} />
        <Route path="/staff-performance" element={<StaffPerformance />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/inventory" element={<InventoryManagement />} />
        <Route path="/kds" element={<KDS />} />
        <Route path="/my-shifts" element={<StaffShifts />} />
        <Route path="/reconciliation" element={<ReconciliationCenter />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/support" element={<Support />} />
        <Route path="/security-policy" element={<InformationSecurityPolicy />} />
        <Route path="/data-retention-policy" element={<DataRetentionPolicy />} />

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/book" element={<BookTable />} />
        <Route path="/schedule-interview" element={<ScheduleInterview />} />
        <Route path="/event-center" element={<EventCenter />} />
        <Route path="/vendor-signup" element={<VendorSignup />} />
        <Route path="/tap-room-society" element={<TapRoomSociety />} />
        <Route path="/my-membership" element={<MyMembership />} />
        <Route path="/founders" element={<FoundersWall />} />
        <Route path="/book-private-room" element={<BookPrivateRoom />} />
        <Route path="/admin/memberships" element={<AdminMemberships />} />
        <Route path="/admin/private-room" element={<AdminPrivateRoom />} />
        <Route path="/admin/points-analytics" element={<AdminPointsAnalytics />} />
        <Route path="/revenue-analytics" element={<RevenueAnalytics />} />
        <Route path="/dining-assistant" element={<ReservationChat />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
    </Suspense>
  );
};


function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <I18nProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </I18nProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App