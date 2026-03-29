'use client';

import React, { useEffect, useState, use } from 'react';
import ReportCard from '../../components/ReportCard';
import api from '@/lib/api';

const Spinner = ({ label }: { label?: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    {label && <p className="text-slate-600 font-medium">{label}</p>}
  </div>
);

export default function ReportCardPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ studentId: string, examId?: string }>, 
  searchParams: Promise<{ examId?: string, semesterId?: string }> 
}) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  
  const studentId = resolvedParams.studentId;
  const examId = resolvedParams.examId || resolvedSearchParams.examId;
  const semesterId = resolvedSearchParams.semesterId;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queryParams = [];
        if (examId && examId !== 'latest') queryParams.push(`examId=${examId}`);
        if (semesterId) queryParams.push(`semesterId=${semesterId}`);
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

        const response = await api.get(`/report-card/${studentId}${queryString}`);
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId, examId, semesterId]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Spinner label="جاري تقرير النتائج الفصلية..." />
    </div>
  );

  if (error) return (
    <div className="p-10 text-center text-red-500 bg-red-50 rounded-lg m-10 border border-red-100">
      <h3 className="text-xl font-bold mb-2">حدث خطأ</h3>
      <p>{error}</p>
    </div>
  );

  return <ReportCard data={data} />;
}
