import React from 'react';
import { PieChart } from 'lucide-react';

export const AttendanceScreen: React.FC = () => {
  return (
    <div className="space-y-6 pb-6 max-w-2xl mx-auto px-4 sm:px-6 pt-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
          <PieChart className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Attendance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Your attendance records and analytics
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
          Coming in Part 3
        </p>
      </div>
    </div>
  );
};
