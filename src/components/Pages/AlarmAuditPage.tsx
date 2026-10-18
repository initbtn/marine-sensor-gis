import React from 'react';
import { useMarineDashboardStore } from '../../stores/useMarineDashboardStore';
import { AlarmList } from '../Dashboard/AlarmList';
import { AlertBadge } from '../Common/AlertBadge';

export const AlarmAuditPage: React.FC = () => {
  const { alarms, acknowledgeAlarm } = useMarineDashboardStore();
  const criticalCount = alarms.filter((a) => a.level === 'CRITICAL').length;
  const warningCount = alarms.filter((a) => a.level === 'WARNING').length;

  return (
    <div className="flex flex-col gap-4 text-slate-100" data-testid="alarm-audit-page">
      <div className="bg-marine-card rounded-xl p-4 border border-marine-border shadow-md">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-marine-border flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-marine-primary">
              🚨 선단 설비 이상 경보 및 조치 이력 (Alarm Audit & Action Log)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <AlertBadge level="CRITICAL" label={`위험 ${criticalCount}건`} />
            <AlertBadge level="WARNING" label={`경고 ${warningCount}건`} />
          </div>
        </div>

        <AlarmList alarms={alarms} onAcknowledge={acknowledgeAlarm} />
      </div>
    </div>
  );
};
