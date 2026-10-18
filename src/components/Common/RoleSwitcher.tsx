import React from 'react';
import { UserRole } from '../../types/telemetry';
import { Anchor, Building2, ShieldCheck, Wrench } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  className?: string;
}

interface RoleConfig {
  role: UserRole;
  title: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
}

export const ROLES: RoleConfig[] = [
  {
    role: 'CHIEF_ENGINEER',
    title: '선박 기관사',
    badge: 'Onboard Edge',
    icon: <Anchor className="w-4 h-4" />,
    description: '0ms 고주파 원시 계측 및 알람 조치',
  },
  {
    role: 'FLEET_OPERATOR',
    title: '육상 관제관',
    badge: 'Inland Control',
    icon: <Building2 className="w-4 h-4" />,
    description: '전 선단 해양 GIS 및 가동률 총괄',
  },
  {
    role: 'COMPLIANCE_OFFICER',
    title: '규제 감사관',
    badge: 'IMO / Class',
    icon: <ShieldCheck className="w-4 h-4" />,
    description: 'MARPOL/BWM 법정 전자 기록부 감사',
  },
  {
    role: 'DIAGNOSTIC_TECH',
    title: '원격 진단원',
    badge: 'Pan-Hawk Tech',
    icon: <Wrench className="w-4 h-4" />,
    description: '5축 설비 건전성 진단 및 예지보전',
  },
];

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onRoleChange,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl gap-1 shadow-md bg-marine-shell border border-marine-border overflow-x-auto ${className}`}
      data-testid="role-switcher"
    >
      {ROLES.map(({ role, title, icon }) => {
        const isActive = currentRole === role;
        return (
          <button
            key={role}
            onClick={() => onRoleChange(role)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium min-h-[44px] transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-marine-cyan text-slate-950 font-bold shadow-sm'
                : 'bg-transparent text-marine-secondary hover:bg-slate-800/60 hover:text-white'
            }`}
            data-testid={`role-btn-${role.toLowerCase()}`}
          >
            {icon}
            <span className="whitespace-nowrap">{title}</span>
          </button>
        );
      })}
    </div>
  );
};
