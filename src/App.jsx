import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { I18nProvider } from '@/lib/i18n';
import AdminDashboard from './pages/AdminDashboard';
import GiftCards from './pages/GiftCards';
import VendorOverchargeAnalysis from './pages/VendorOverchargeAnalysis';
import MileageTracking from './pages/MileageTracking';
import PostedShifts from './pages/PostedShifts';
import Events from './pages/Events';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Home from './pages/Home';
import ReservationsCalendar from './pages/ReservationsCalendar';
import EmailMarketing from './pages/EmailMarketing';
import SubmitReview from './pages/SubmitReview';
import LoyaltyProgram from './pages/LoyaltyProgram';
import StaffScheduler from './pages/StaffScheduler';
import DigitalMenu from './pages/DigitalMenu';
import TableQRCodes from './pages/TableQRCodes';
import KitchenDashboard from './pages/KitchenDashboard';
import MenuPerformance from './pages/MenuPerformance';
import LoyaltyPortal from './pages/LoyaltyPortal';
import StaffPerformance from './pages/StaffPerformance';
import Checkout from './pages/Checkout';
import InventoryManagement from './pages/InventoryManagement';
import KDS from './pages/KDS';
import StaffShifts from './pages/StaffShifts';
import ReconciliationCenter from './pages/ReconciliationCenter';
import Menu from './pages/Menu';
import ContactUs from './pages/ContactUs';
import Support from './pages/Support';
import InformationSecurityPolicy from './pages/InformationSecurityPolicy';
import DataRetentionPolicy from './pages/DataRetentionPolicy';
import RLSPolicy from './pages/RLSPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import BookTable from './pages/BookTable';

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
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
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
        <Route path="/table-qr-codes" element={<TableQRCodes />} />
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
        <Route path="/rls-policy" element={<RLSPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/book" element={<BookTable />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {
  return (
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
  );
}

export default App