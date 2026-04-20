import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Wallet, 
  AlertCircle,
  ArrowRight,
  School,
  CheckCircle2
} from 'lucide-react';

interface HomePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ blocked?: string; reason?: string; tenantName?: string }>;
}

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { locale } = await params;
  const { blocked, reason, tenantName } = await searchParams;
  const t = await getTranslations('landing');
  const commonT = await getTranslations('common');

  const isBlocked = blocked === 'true';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <School className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400">
              delSchool
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-medium">
                {t('login')}
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20">
                {t('register')}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto space-y-24">
          
          {/* Subscription Alert */}
          {isBlocked && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-1 rounded-2xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/20">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 text-center sm:text-start">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {t('blocked_title')} {tenantName && `- ${tenantName}`}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {t('blocked_message')}
                    </p>
                  </div>
                  <a href="mailto:support@delschool.dz">
                    <Button variant="outline" className="border-red-200 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10 whitespace-nowrap">
                      {t('contact_support')}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Hero Section */}
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              Revolutionizing School Management
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              {t('title')}
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t('subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {t('register')}
                  <ArrowRight className="ms-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  {t('login')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<LayoutDashboard className="w-6 h-6 text-indigo-600" />}
              title={t('feature_1_title')}
              description={t('feature_1_desc')}
            />
            <FeatureCard 
              icon={<Wallet className="w-6 h-6 text-emerald-600" />}
              title={t('feature_2_title')}
              description={t('feature_2_desc')}
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-amber-600" />}
              title={t('feature_3_title')}
              description={t('feature_3_desc')}
            />
          </div>

          {/* Stats / Proof */}
          <div className="pt-20 border-t border-slate-200 dark:border-slate-800">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-slate-900 dark:text-white">500+</div>
                  <div className="text-slate-500">Schools Trusted</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-slate-900 dark:text-white">50k+</div>
                  <div className="text-slate-500">Active Students</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-slate-900 dark:text-white">99.9%</div>
                  <div className="text-slate-500">System Uptime</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-slate-900 dark:text-white">24/7</div>
                  <div className="text-slate-500">Expert Support</div>
                </div>
             </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <School className="text-indigo-600 w-5 h-5" />
            <span className="font-bold text-slate-900 dark:text-white">delSchool</span>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} delSchool Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all group overflow-hidden relative">
      <div className="relative z-10 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 dark:text-white transition-opacity">
        <CheckCircle2 className="w-12 h-12" />
      </div>
    </div>
  );
}