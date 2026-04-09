'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, Mail, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function BlockedPage() {
  const t = useTranslations('common');
  const params = useParams();
  const [schoolName, setSchoolName] = useState<string>('Your School');
  const [reason, setReason] = useState<string>('Expired');
  const [expiryDate, setExpiryDate] = useState<string>('');

  useEffect(() => {
    // Attempt to fetch status details from the URL or a temporary storage if passed
    const searchParams = new URLSearchParams(window.location.search);
    const reasonParam = searchParams.get('reason');
    if (reasonParam) setReason(reasonParam);

    // In a real scenario, we might want to fetch the school name via an API call 
    // using the tenantId extracted from the JWT (which we can get from cookies here)
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="relative h-32 bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/30">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="p-8 text-center">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-slate-900 dark:text-white mb-2"
          >
            {schoolName}
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium mb-6"
          >
            Access {reason === 'SUSPENDED' ? 'Suspended' : 'Expired'}
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed"
          >
            {reason === 'SUSPENDED' 
              ? 'Your administration access has been suspended. Please contact the system provider for more details.' 
              : 'Your school subscription has reached its end. To maintain access to your student data, finances, and reports, a renewal is required.'
            }
          </motion.p>

          <div className="space-y-4">
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="mailto:admin@delschool.com"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-semibold shadow-lg transition-colors hover:bg-slate-800 dark:hover:bg-slate-100"
            >
              <Mail className="w-5 h-5" />
              Contact admin to renew
            </motion.a>

            <motion.button
              whileHover={{ x: 5 }}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 text-sm font-medium inline-flex items-center gap-1 transition-all"
              onClick={() => window.location.href = `/${params.locale}/login`}
            >
              Sign in with a different account <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-600 uppercase tracking-widest font-bold">
            DelSchool Subscription Management
          </p>
        </div>
      </motion.div>
    </div>
  );
}
