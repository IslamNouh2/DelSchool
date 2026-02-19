"use client"

const Announcement = () => {
    return (
        <div className='bg-transparent flex flex-col gap-6'>
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase transition-colors">Recent News</h1>
                <span className="text-[10px] font-black text-[#0052cc] hover:text-blue-400 cursor-pointer transition-all uppercase tracking-widest">View All</span>
            </div>
            <div className="flex flex-col gap-4">
                <div className="bg-gray-50/50 dark:bg-[#0b0d17]/50 rounded-[24px] p-6 border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-[#0b0d17] hover:border-blue-500/20 dark:hover:border-blue-500/20 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="font-black text-sm text-gray-700 dark:text-gray-200 group-hover:text-[#0052cc] transition-colors tracking-tight uppercase">School Gala Evening</h1>
                        <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1a1c2e] py-1 px-3 rounded-full border border-gray-100 dark:border-white/5 uppercase tracking-widest transition-colors">2025/12/25</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium transition-colors">Join us for an unforgettable evening of performance and celebration with our students and faculty.</p>
                </div>
                <div className="bg-gray-50/50 dark:bg-[#0b0d17]/50 rounded-[24px] p-6 border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-[#0b0d17] hover:border-blue-500/20 dark:hover:border-blue-500/20 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="font-black text-sm text-gray-700 dark:text-gray-200 group-hover:text-[#0052cc] transition-colors tracking-tight uppercase">Exam Schedule Out</h1>
                        <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1a1c2e] py-1 px-3 rounded-full border border-gray-100 dark:border-white/5 uppercase tracking-widest transition-colors">2025/12/25</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium transition-colors">The mid-term examination schedule has been released. Please download it from the student portal.</p>
                </div>
                <div className="bg-gray-50/50 dark:bg-[#0b0d17]/50 rounded-[24px] p-6 border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-[#0b0d17] hover:border-blue-500/20 dark:hover:border-blue-500/20 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="font-black text-sm text-gray-700 dark:text-gray-200 group-hover:text-[#0052cc] transition-colors tracking-tight uppercase">New Lab Equipment</h1>
                        <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1a1c2e] py-1 px-3 rounded-full border border-gray-100 dark:border-white/5 uppercase tracking-widest transition-colors">2025/12/25</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium transition-colors">We are pleased to announce the addition of state-of-the-art science equipment to our secondary labs.</p>
                </div>
            </div>
        </div>
    );
};

export default Announcement
