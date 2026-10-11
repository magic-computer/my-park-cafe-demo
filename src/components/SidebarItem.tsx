import React from 'react';

export const SidebarItem = ({ active, icon: Icon, label, onClick, collapsed }: { active: boolean, icon: any, label: string, onClick: () => void, collapsed?: boolean }) => (
  <button 
    onClick={onClick}
    className={`flex items-center w-full rounded-xl transition-all duration-200 ${
      collapsed ? 'justify-center p-3 mb-2' : 'px-4 py-3 mb-2'
    } ${
      active 
        ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
        : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
    }`}
    title={collapsed ? label : undefined}
  >
    <Icon className="w-5 h-5 shrink-0" />
    {!collapsed && <span className="font-medium ml-3 whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>}
  </button>
);
