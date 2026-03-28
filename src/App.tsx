import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CmsProvider } from "@/contexts/CmsContext";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import ContentManager from "./pages/admin/ContentManager";
import MenuManager from "./pages/admin/MenuManager";
import ServicesManager from "./pages/admin/ServicesManager";
import FormationsManager from "./pages/admin/FormationsManager";
import BlogManager from "./pages/admin/BlogManager";
import CommentsManager from "./pages/admin/CommentsManager";
import ClientsManager from "./pages/admin/ClientsManager";
import ReservationsManager from "./pages/admin/ReservationsManager";
import InvoicesManager from "./pages/admin/InvoicesManager";
import QuotesManager from "./pages/admin/QuotesManager";
import MediaManager from "./pages/admin/MediaManager";
import ThemeManager from "./pages/admin/ThemeManager";
import SettingsManager from "./pages/admin/SettingsManager";
import "@/i18n";
import { getBaseLanguage } from '@/lib/i18n-utils';

const queryClient = new QueryClient();

const App = () => {
  const { i18n } = useTranslation();

  const scrollToHashTarget = (hash: string, behavior: ScrollBehavior = 'smooth') => {
    if (!hash || !hash.startsWith('#')) {
      return;
    }

    const target = document.querySelector(hash) as HTMLElement | null;
    if (!target) {
      return;
    }

    const navbar = document.querySelector('[data-site-navbar="true"]') as HTMLElement | null;
    const navbarOffset = navbar ? navbar.getBoundingClientRect().height : 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    const top = Math.max(0, targetTop - navbarOffset - 8);

    window.scrollTo({ top, behavior });
  };

  useEffect(() => {
    const baseLanguage = getBaseLanguage(i18n.resolvedLanguage || i18n.language);
    document.documentElement.lang = baseLanguage;
    document.documentElement.dir = baseLanguage === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language, i18n.resolvedLanguage]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const clicked = event.target as HTMLElement | null;
      const anchor = clicked?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }

      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') {
        return;
      }

      const target = document.querySelector(hash);
      if (!target) {
        return;
      }

      event.preventDefault();
      scrollToHashTarget(hash, 'smooth');
      window.history.replaceState(null, '', hash);
    };

    document.addEventListener('click', handleAnchorClick);

    if (window.location.hash) {
      requestAnimationFrame(() => {
        scrollToHashTarget(window.location.hash, 'auto');
      });
    }

    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CmsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />
                <Route path="/admin/content" element={<ProtectedRoute requireAdmin><ContentManager /></ProtectedRoute>} />
                <Route path="/admin/menu" element={<ProtectedRoute requireAdmin><MenuManager /></ProtectedRoute>} />
                <Route path="/admin/services" element={<ProtectedRoute requireAdmin><ServicesManager /></ProtectedRoute>} />
                <Route path="/admin/formations" element={<ProtectedRoute requireAdmin><FormationsManager /></ProtectedRoute>} />
                <Route path="/admin/blog" element={<ProtectedRoute requireAdmin><BlogManager /></ProtectedRoute>} />
                <Route path="/admin/commentaires" element={<ProtectedRoute requireAdmin><CommentsManager /></ProtectedRoute>} />
                <Route path="/admin/clients" element={<ProtectedRoute requireAdmin><ClientsManager /></ProtectedRoute>} />
                <Route path="/admin/reservations" element={<ProtectedRoute requireAdmin><ReservationsManager /></ProtectedRoute>} />
                <Route path="/admin/factures" element={<ProtectedRoute requireAdmin><InvoicesManager /></ProtectedRoute>} />
                <Route path="/admin/devis" element={<ProtectedRoute requireAdmin><QuotesManager /></ProtectedRoute>} />
                <Route path="/admin/medias" element={<ProtectedRoute requireAdmin><MediaManager /></ProtectedRoute>} />
                <Route path="/admin/theme" element={<ProtectedRoute requireAdmin><ThemeManager /></ProtectedRoute>} />
                <Route path="/admin/parametres" element={<ProtectedRoute requireAdmin><SettingsManager /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </CmsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
