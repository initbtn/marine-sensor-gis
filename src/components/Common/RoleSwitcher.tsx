import React from 'react';
import { MarineTheme } from '../../styles/theme';
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
      className={`inline-flex items-center p-1.5 rounded-xl gap-1 shadow-md ${className}`}
      style={{
        backgroundColor: MarineTheme.colors.bgSecondary,
        border: `1px solid ${MarineTheme.colors.border}`,
      }}
      data-testid="role-switcher"
    >
      {ROLES.map(({ role, title, icon }) => {
        const isActive = currentRole === role;
        return (
          <button
            key={role}
            onClick={() => onRoleChange(role)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
              isActive
                ? 'shadow-sm font-semibold'
                : 'hover:bg-slate-800/60 opacity-80 hover:opacity-100'
            }`}
            style={{
              backgroundColor: isActive
                ? MarineTheme.colors.ecoCyan
                : 'transparent',
              color: isActive
                ? MarineTheme.colors.bgPrimary
                : MarineTheme.colors.textSecondary,
            }}
            data-testid={`role-btn-${role.toLowerCase()}`}
          >
            {icon}
            <span>{title}</span>
          </button>
        );
      })}
    </div>
  );
};
