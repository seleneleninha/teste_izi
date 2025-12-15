import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  data: any[];
  dataKey: string;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, change, isPositive, data, dataKey, color }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-full shadow-sm border border-slate-700 flex flex-col h-64">
      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
        <div className="text-3xl font-bold text-white mb-2">{value}</div>
        <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <ArrowUp size={16} className="mr-1" /> : <ArrowDown size={16} className="mr-1" />}
          {change} <span className="text-slate-500 ml-1 font-normal">Last 7 Days</span>
        </div>
      </div>

      <div className="flex-1 mt-4 w-full min-h-[100px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={100}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#color${label})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};