import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/useAdminData';
import { 
  Users, 
  Calendar, 
  Receipt, 
  FileSpreadsheet, 
  BookOpen, 
  MessageSquare,
  Euro,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useDashboardStats();

  const statCards = [
    {
      title: t('dashboard.stats.clients.title'),
      value: stats?.totalClients || 0,
      description: t('dashboard.stats.clients.description'),
      icon: Users,
      color: 'text-blue-500',
      href: '/admin/clients',
    },
    {
      title: t('dashboard.stats.reservations.title'),
      value: stats?.totalReservations || 0,
      description: `${stats?.pendingReservations || 0} ${t('dashboard.stats.reservations.pendingDescription')}`,
      icon: Calendar,
      color: 'text-accent',
      href: '/admin/reservations',
    },
    {
      title: t('dashboard.stats.revenue.title'),
      value: `${(stats?.totalRevenue || 0).toLocaleString('fr-FR')} €`,
      description: t('dashboard.stats.revenue.description'),
      icon: Euro,
      color: 'text-green-500',
      href: '/admin/factures',
    },
    {
      title: t('dashboard.stats.unpaidInvoices.title'),
      value: stats?.unpaidInvoices || 0,
      description: t('dashboard.stats.unpaidInvoices.description'),
      icon: Receipt,
      color: 'text-orange-500',
      href: '/admin/factures',
    },
    {
      title: t('dashboard.stats.pendingQuotes.title'),
      value: stats?.pendingQuotes || 0,
      description: `${stats?.totalQuotes || 0} ${t('dashboard.stats.pendingQuotes.totalDescription')}`,
      icon: FileSpreadsheet,
      color: 'text-purple-500',
      href: '/admin/devis',
    },
    {
      title: t('dashboard.stats.blogPosts.title'),
      value: stats?.totalBlogPosts || 0,
      description: t('dashboard.stats.blogPosts.description'),
      icon: BookOpen,
      color: 'text-indigo-500',
      href: '/admin/blog',
    },
    {
      title: t('dashboard.stats.comments.title'),
      value: stats?.pendingComments || 0,
      description: t('dashboard.stats.comments.description'),
      icon: MessageSquare,
      color: 'text-rose-500',
      href: '/admin/commentaires',
    },
  ];

  const quickActions = [
    { href: '/admin/reservations', label: t('dashboard.quickActions.newReservation'), icon: Calendar },
    { href: '/admin/clients', label: t('dashboard.quickActions.addClient'), icon: Users },
    { href: '/admin/factures', label: t('dashboard.quickActions.createInvoice'), icon: Receipt },
    { href: '/admin/devis', label: t('dashboard.quickActions.createQuote'), icon: FileSpreadsheet },
    { href: '/admin/blog', label: t('dashboard.quickActions.writeArticle'), icon: BookOpen },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('dashboard.welcome')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} to={stat.href}>
                <Card className="border-border/50 hover:border-accent/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoading ? '...' : stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>{t('dashboard.quickActions.title')}</CardTitle>
              <CardDescription>
                {t('dashboard.quickActions.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    to={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-accent" />
                    <span className="font-medium text-sm">{action.label}</span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>{t('dashboard.languages.title')}</CardTitle>
              <CardDescription>
                {t('dashboard.languages.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { code: 'FR', name: 'Français', flag: '🇫🇷' },
                  { code: 'EN', name: 'English', flag: '🇬🇧' },
                  { code: 'AR', name: 'العربية', flag: '🇸🇦' },
                  { code: 'ZH', name: '中文', flag: '🇨🇳' },
                ].map((lang) => (
                  <div 
                    key={lang.code}
                    className="p-3 rounded-lg bg-secondary flex items-center gap-3"
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <div className="font-medium text-sm">{lang.code}</div>
                      <div className="text-xs text-muted-foreground">{lang.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
