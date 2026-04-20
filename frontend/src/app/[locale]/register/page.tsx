import RegisterForm from '@/components/register/RegisterForm';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-gray-900 tracking-tight">Register your school on DelSchool</h1>
          <p className="text-gray-500 mt-2 text-sm">Empowering education with advanced management tools</p>
        </div>

        {/* The Form */}
        <RegisterForm locale={locale} />

        {/* Footer info */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} DelSchool Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
