'use client';
import React, { useState, useEffect } from 'react';

const WILAYAS = ['Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar','Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem',"M'Sila",'Mascara','Ouargla','Oran','El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent','Ghardaïa','Relizane'];

import api from '@/lib/api';
import { PLAN_PRICES, Plan, BillingPeriod } from '@/lib/pricing.constants';

const PLANS = [
  { id: 'STARTER', features: ['Up to 300 students', '5 teachers', 'Basic reports', 'Email support'] },
  { id: 'PRO', features: ['Up to 1000 students', '20 teachers', 'Advanced analytics', 'Priority support', 'AI timetable'], popular: true },
  { id: 'ENTERPRISE', features: ['Unlimited students', 'Unlimited teachers', 'Full analytics suite', '24/7 support', 'AI timetable', 'Custom domain'] },
];

export default function RegisterForm({ locale }: { locale: string }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    wilaya: '',
    plan: 'PRO',
    billingPeriod: 'MONTHLY' as BillingPeriod,
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateSlug = (name: string) => 
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      name, 
      domain: generateSlug(name) 
    }));
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.name) newErrors.name = 'School name is required';
      if (!formData.domain) newErrors.domain = 'Domain is required';
      else if (!/^[a-z0-9-]+$/.test(formData.domain)) newErrors.domain = 'Only lowercase, numbers, and hyphens';
      if (!formData.wilaya) newErrors.wilaya = 'Wilaya is required';
    } else if (step === 3) {
      if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Valid email is required';
      if (!formData.password || formData.password.length < 8) newErrors.password = 'Min 8 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.terms) newErrors.terms = 'You must agree to terms';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setSubmitError('');
    try { 
      const res = await api.post('/tenants/register', {
        name: formData.name,
        domain: formData.domain,
        adminEmail: formData.email,
        adminPassword: formData.password,
        plan: formData.plan,
        billingPeriod: formData.billingPeriod,
        wilaya: formData.wilaya,
      });
      window.location.href = `/${locale}/auth/login?registered=true`;
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
      {/* STEP INDICATOR */}
      <div className="flex items-center gap-2 mb-10 px-4">
        {[1, 2, 3].map(s => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
              ${step >= s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {s}
            </div>
            {s < 3 && <div className={`flex-1 h-px transition-colors ${step > s ? 'bg-gray-900' : 'bg-gray-100'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: SCHOOL INFO */}
      {step === 1 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-1">
            <label className="text-[13px] font-medium text-gray-700">School Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g. Al-Amel Private School"
              className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-gray-300"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-gray-700">Dashboard UI Domain</label>
            <div className="relative">
              <input
                type="text"
                value={formData.domain}
                onChange={e => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-gray-300"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">.delschool.dz</span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono mt-1">Preview: {formData.domain || 'myschool'}.delschool.dz</p>
            {errors.domain && <p className="text-red-500 text-xs">{errors.domain}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-gray-700">Wilaya (Region)</label>
            <select
              value={formData.wilaya}
              onChange={e => setFormData(prev => ({ ...prev, wilaya: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 outline-none"
            >
              <option value="">Select a region</option>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            {errors.wilaya && <p className="text-red-500 text-xs">{errors.wilaya}</p>}
          </div>
        </div>
      )}

      {/* STEP 2: PLAN SELECTION */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 p-1 rounded-full flex gap-1">
              {['MONTHLY', 'QUARTERLY', 'YEARLY'].map(p => (
                <button
                  key={p}
                  onClick={() => setFormData(prev => ({ ...prev, billingPeriod: p as BillingPeriod }))}
                  className={`px-4 py-1 rounded-full text-[11px] font-semibold transition-all
                    ${formData.billingPeriod === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => {
              const price = PLAN_PRICES[plan.id as Plan][formData.billingPeriod];
              const isSelected = formData.plan === plan.id;
              
              return (
                <div
                  key={plan.id}
                  onClick={() => setFormData(prev => ({ ...prev, plan: plan.id }))}
                  className={`relative p-5 rounded-xl transition-all cursor-pointer border-2
                    ${isSelected ? 'border-gray-900 ring-4 ring-gray-900/5' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Most Popular</span>}
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{plan.id}</h4>
                  <p className="text-xl font-medium text-gray-900 mb-4">{price.toLocaleString()} <span className="text-[10px] text-gray-500">DZD</span></p>
                  <ul className="space-y-2 mb-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-[11px] text-gray-500 flex items-start gap-2">
                        <span className="text-green-500 font-bold shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: ADMIN ACCOUNT */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-1">
            <label className="text-[13px] font-medium text-gray-700">Administrator Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="admin@school.com"
              className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-gray-300"
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[13px] font-medium text-gray-700">Admin Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-gray-300"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-gray-300"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="pt-2 flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={formData.terms}
              onChange={e => setFormData(prev => ({ ...prev, terms: e.target.checked }))}
              className="mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-0"
            />
            <label htmlFor="terms" className="text-xs text-gray-500 leading-normal">
              I agree to the <a href="#" className="underline font-medium text-gray-700">Terms of Service</a> and allow DelSchool to process my school data securely.
            </label>
          </div>
          {errors.terms && <p className="text-red-500 text-xs">{errors.terms}</p>}

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs text-center font-medium">
              {submitError}
            </div>
          )}
        </div>
      )}

      {/* NAVIGATION */}
      <div className="mt-10 flex gap-3">
        {step > 1 && (
          <button
            onClick={prevStep}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-50"
          >
            Back
          </button>
        )}
        {step < 3 ? (
          <button
            onClick={nextStep}
            className="flex-[2] px-4 py-2.5 bg-gray-900 text-white rounded-lg text-[13px] font-medium hover:bg-gray-800 shadow-sm"
          >
            Next step
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] px-4 py-2.5 bg-gray-900 text-white rounded-lg text-[13px] font-medium hover:bg-gray-800 shadow-sm flex items-center justify-center gap-2"
          >
            {loading && <div className="animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4" />}
            Create school
          </button>
        )}
      </div>
    </div>
  );
}
