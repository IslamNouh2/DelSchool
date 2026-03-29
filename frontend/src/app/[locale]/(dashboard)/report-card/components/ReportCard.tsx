'use client';

import React, { useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, LineChart, Line, Legend
} from 'recharts';
import { IconPrinter, IconTrophy, IconAlertTriangle, IconCalendar, IconUser, IconTrendingUp, IconPercentage } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface SubjectScore {
  name: string;
  subjectId: number;
  weeklyHours: number;
  coff: number;
  teacherName: string;
  scores: {
    totalScore: number;
    examScores: { examType: string, score: number | null }[];
  };
  gradeLetter: string;
  remarks: string;
  subSubjects?: SubjectScore[];
}

interface ReportCardProps {
  data: {
    studentInfo: {
      id: number;
      firstName: string;
      lastName: string;
      code: string;
      class: string;
      parentContact: string;
    };
    schoolInfo: {
      name: string;
      academicYear: string;
      semester: string;
    };
    semesterInfo: {
      id: number;
      name: string;
      startDate: string;
      endDate: string;
    };
    subjects: SubjectScore[];
    totalAverage: number;
    attendanceSummary: {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      lateDays: number;
      attendancePercentage: number;
    };
    behaviorSummary: {
      points: number;
      remarks: string;
      incidents: number;
    };
    aiRecommendations: string[];
    visualization: {
      barChartGrades: { subject: string; score: number }[];
      lineChartProgress: { exam: string; average: number }[];
      attendanceGraph: { name: string; value: number }[];
    };
    exams: { name: string; id: number }[];
  };
}

const RecursiveSubjectRow: React.FC<{ subject: SubjectScore, level: number, exams: any[] }> = ({ subject, level, exams }) => {
  const hasSubSubjects = subject.subSubjects && subject.subSubjects.length > 0;
  
  return (
    <>
      <tr className={`border-b transition-colors hover:bg-slate-50/50 ${level > 0 ? 'bg-slate-50/30' : ''}`}>
        <td className="p-4 font-bold text-slate-800 flex items-center gap-2" style={{ paddingRight: `${level * 24 + 16}px` }}>
          {level > 0 && <span className="text-slate-300">└─</span>}
          <div className="flex flex-col">
            <span>{subject.name}</span>
            {subject.weeklyHours > 0 && <span className="text-[10px] text-slate-400 font-normal">{subject.weeklyHours}h/week</span>}
          </div>
        </td>
        <td className="p-4 text-center font-mono text-slate-400 font-bold">{subject.coff}</td>
        {exams.map((e, i) => {
          const score = subject.scores.examScores.find(es => es.examType === e.name)?.score;
          return (
            <td key={i} className={`p-4 text-center font-medium ${score !== null ? 'text-slate-700' : 'text-slate-300'}`}>
              {score ?? '-'}
            </td>
          );
        })}
        <td className={`p-4 text-center font-black ${subject.scores.totalScore >= 50 ? 'text-indigo-600' : 'text-red-500'}`}>
          {subject.scores.totalScore}
        </td>
        <td className="p-4 text-center">
          <div className="flex flex-col items-center">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
              subject.scores.totalScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 
              subject.scores.totalScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
            }`}>
              {subject.gradeLetter}
            </span>
            <span className="text-[9px] text-slate-400 mt-1 block max-w-[80px] truncate" title={subject.remarks}>{subject.remarks}</span>
          </div>
        </td>
      </tr>
      {hasSubSubjects && subject.subSubjects!.map((sub, i) => (
        <RecursiveSubjectRow key={i} subject={sub} level={level + 1} exams={exams} />
      ))}
    </>
  );
};

const ReportCard: React.FC<ReportCardProps> = ({ data }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`ReportCard_${data.studentInfo.firstName}_${data.studentInfo.lastName}.pdf`);
  };

  return (
    <div className="flex flex-col gap-8 p-8 font-['Outfit',sans-serif] rtl min-h-screen bg-slate-50/50" dir="rtl">
      {/* Action Bar */}
      <div className="flex justify-between items-center no-print max-w-5xl mx-auto w-full">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">كشف النقاط المدرسي</h1>
          <p className="text-slate-500 text-sm">إدارة النتائج والتقييمات الفصلية</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 shadow-sm hover:bg-white">
            <IconTrendingUp size={18} className="ml-2 text-indigo-500" />
            تحليل متقدم
          </Button>
          <Button onClick={downloadPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl px-6 transition-all hover:scale-[1.02]">
            <IconPrinter size={20} className="ml-2" />
            <span>طباعة التقرير</span>
          </Button>
        </div>
      </div>

      {/* Main Report Body */}
      <div ref={reportRef} className="max-w-5xl mx-auto w-full bg-white p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] relative overflow-hidden report-paper print:m-0 print:p-8 print:shadow-none print:rounded-none">
        
        {/* Subtle Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-50/50 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

        {/* Decorative Top Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
        
        {/* Header Section */}
        <div className="header-section flex flex-col md:flex-row justify-between items-center md:items-start mb-12 gap-8 border-b border-slate-100 pb-10">
          <div className="text-center md:text-right flex flex-col items-center md:items-start gap-3">
             <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 mb-2 rotate-3 hover:rotate-0 transition-transform">
               <IconTrophy size={32} stroke={2.5} />
             </div>
             <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{data.schoolInfo.name}</h2>
                <div className="flex items-center gap-2 mt-1 text-slate-400 font-bold text-xs">
                  <IconCalendar size={14} />
                  <span>{data.schoolInfo.academicYear} — {data.schoolInfo.semester}</span>
                </div>
             </div>
          </div>

          <div className="flex-1 max-w-sm w-full bg-slate-50/80 backdrop-blur-sm p-6 rounded-3xl border border-white shadow-inner">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-2xl">
                👨‍🎓
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-slate-900">{data.studentInfo.firstName} {data.studentInfo.lastName}</span>
                <span className="text-xs text-indigo-500 font-bold tracking-widest">{data.studentInfo.class}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200/50">
               <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">الرقم التسلسلي</p>
                  <p className="text-sm font-mono font-bold text-slate-700">#{data.studentInfo.code}</p>
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">المعدل العام</p>
                  <p className="text-sm font-black text-indigo-600">{data.totalAverage}%</p>
               </div>
            </div>
          </div>
        </div>

        {/* Subjects Data Table */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <div className="w-2 h-6 bg-indigo-600 rounded-full" />
              تفاصيل النتائج والمواد
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
              الأساس: 20/20
            </span>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-5 text-right font-black">المادة والمحتوى</th>
                  <th className="p-5 text-center font-bold text-slate-400">المعامل</th>
                  {data.exams.map((e, i) => (
                    <th key={i} className="p-5 text-center font-bold text-slate-300">{e.name}</th>
                  ))}
                  <th className="p-5 text-center font-black">المعدل</th>
                  <th className="p-5 text-center font-black">التقدير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.subjects.map((subject, idx) => (
                  <RecursiveSubjectRow key={idx} subject={subject} level={0} exams={data.exams} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics & Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-start">
          
          {/* Main Visualizations (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-50/50 p-8 overflow-hidden relative">
              <div className="flex items-center justify-between mb-8">
                <h4 className="font-black text-slate-800 flex items-center gap-2 text-sm">
                  <IconTrendingUp size={16} className="text-indigo-500" />
                  تحليل الأداء الفصلي
                </h4>
                <div className="flex gap-2 text-[10px] font-bold">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500" /> الأداء الفعلي</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-200" /> المتوسط</span>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {data.visualization?.lineChartProgress ? (
                    <LineChart data={data.visualization.lineChartProgress}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="exam" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight:700 }} />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 800 }} />
                      <Line type="monotone" dataKey="average" stroke="#6366f1" strokeWidth={5} dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  ) : <div className="flex items-center justify-center h-full text-slate-400 italic">No trend data available</div>}
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المواظبة</span>
                    <IconUser size={16} className="text-indigo-400" />
                 </div>
                 <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-slate-900">{data.attendanceSummary.attendancePercentage}%</span>
                    <span className={`text-[10px] font-bold mb-1.5 ${data.attendanceSummary.attendancePercentage > 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {data.attendanceSummary.presentDays} يوم حاضر
                    </span>
                 </div>
                 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${data.attendanceSummary.attendancePercentage}%` }} />
                 </div>
              </div>

              <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl shadow-slate-200 flex flex-col justify-between">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">السلوك والانضباط</span>
                    <IconTrophy size={16} className="text-amber-400" />
                 </div>
                 <p className="text-xs font-medium text-slate-300 leading-relaxed italic border-r-2 border-indigo-500 pr-3">
                   "{data.behaviorSummary.remarks}"
                 </p>
                 <div className="mt-4 text-right">
                    <span className="text-2xl font-black">100/100</span>
                 </div>
              </div>
            </div>
          </div>

          {/* AI Insights & Recs (4 cols) */}
          <div className="lg:col-span-4 bg-indigo-50/30 border border-indigo-100/50 p-8 rounded-[2.5rem] sticky top-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <IconAlertTriangle size={20} />
              </div>
              <h4 className="font-black text-indigo-900 text-sm italic">DelSchool AI Insights</h4>
            </div>
            
            <div className="space-y-4">
              {data.aiRecommendations.map((rec, i) => (
                <div key={i} className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[11px] text-slate-700 font-bold leading-relaxed">{rec}</p>
                </div>
              ))}
              {data.aiRecommendations.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-10">جاري تحليل البيانات...</p>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-indigo-100">
              <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Verified by DelSchool Core Engine</span>
                <IconPercentage size={10} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-slate-100">
          <div className="flex flex-col gap-1 items-center md:items-start">
             <span className="text-[10px] font-black text-slate-400 uppercase">ختم المؤسسة</span>
             <div className="w-32 h-16 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-[10px] text-slate-200">
               DelSchool Stamp
             </div>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-bold text-slate-900 mb-1">توقيع ولي الأمر</p>
            <div className="w-40 h-[1px] bg-slate-200 mx-auto" />
          </div>
          <div className="flex flex-col gap-1 items-center md:items-end">
             <span className="text-[10px] font-black text-slate-400 uppercase">توقيع المدير</span>
             <div className="w-32 h-16 border-2 border-dashed border-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;400;700;900&display=swap');
        
        @media print {
          .no-print { display: none !important; }
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important;
            -webkit-print-color-adjust: exact; 
          }
          .report-paper { 
            box-shadow: none !important; 
            border: none !important; 
            padding: 0 !important; 
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .header-section { margin-bottom: 2rem !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportCard;
