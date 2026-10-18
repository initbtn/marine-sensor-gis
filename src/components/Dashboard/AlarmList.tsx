import React from 'react';
import { AlarmEvent } from '../../types/telemetry';
import { AlertBadge } from '../Common/AlertBadge';

interface AlarmListProps {
  alarms: AlarmEvent[];
  onAcknowledge: (alarmId: string) => void;
  className?: string;
}

export const AlarmList: React.FC<AlarmListProps> = ({ alarms, onAcknowledge, className = '' }) => {
  return (
    <div
      className={`bg-marine-card rounded-xl p-4 border border-marine-border shadow-lg mt-4 ${className}`}
      data-testid="alarm-list"
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="m-0 text-sm md:text-base text-marine-primary font-semibold">
          ⚠️ 실시간 설비 경보 및 규제 감시 이력
        </h4>
        <span className="text-xs text-marine-secondary">총 {alarms.length}건</span>
      </div>

      {alarms.length === 0 ? (
        <div className="py-6 text-center text-marine-muted text-sm">
          현재 감지된 설비 이상 또는 규제 위반 경보가 없습니다. (정상 운항 중)
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto marine-scrollbar pr-1">
          {alarms.map((alarm) => {
            const isCritical = alarm.level === 'CRITICAL';
            return (
              <div
                key={alarm.id}
                className={`flex justify-between items-center p-2.5 md:px-3.5 rounded-md border border-marine-border text-xs md:text-sm ${
                  isCritical
                    ? 'bg-rose-950/20 border-l-4 border-l-rose-500'
                    : 'bg-amber-950/20 border-l-4 border-l-amber-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlertBadge level={alarm.level} />
                  <div>
                    <div className="font-semibold text-marine-primary">
                      [{alarm.code}] {alarm.message}
                    </div>
                    <div className="text-[11px] text-marine-muted mt-0.5">
                      {alarm.vesselName} ({alarm.facilityType}) | {new Date(alarm.timestamp).toLocaleTimeString('ko-KR')}
                    </div>
                  </div>
                </div>

                <div>
                  {!alarm.acknowledged ? (
                    <button
                      type="button"
                      onClick={() => onAcknowledge(alarm.id)}
                      className="px-3 py-1 rounded text-xs font-semibold border border-marine-border bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/60 min-h-[36px] cursor-pointer transition-all"
                    >
                      확인
                    </button>
                  ) : (
                    <span className="text-[11px] text-marine-muted">확인됨</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
