import React from 'react';
import { AlarmEvent } from '../../types/telemetry';
import { MarineTheme } from '../../styles/theme';
import { AlertBadge } from '../Common/AlertBadge';

interface AlarmListProps {
  alarms: AlarmEvent[];
  onAcknowledge: (alarmId: string) => void;
}

export const AlarmList: React.FC<AlarmListProps> = ({ alarms, onAcknowledge }) => {
  return (
    <div
      style={{
        background: MarineTheme.colors.bgPrimary,
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        border: `1px solid ${MarineTheme.colors.border}`,
        marginTop: '16px',
      }}
      data-testid="alarm-list"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '15px', color: MarineTheme.colors.textPrimary, fontWeight: 600 }}>
          ⚠️ 실시간 설비 경보 및 규제 감시 이력
        </h4>
        <span style={{ fontSize: '12px', color: MarineTheme.colors.textSecondary }}>총 {alarms.length}건</span>
      </div>

      {alarms.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: MarineTheme.colors.textMuted, fontSize: '14px' }}>
          현재 감지된 설비 이상 또는 규제 위반 경보가 없습니다. (정상 운항 중)
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
          {alarms.map((alarm) => {
            const isCritical = alarm.level === 'CRITICAL';
            return (
              <div
                key={alarm.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: isCritical ? 'rgba(231, 29, 54, 0.12)' : 'rgba(255, 159, 28, 0.12)',
                  borderLeft: `4px solid ${isCritical ? MarineTheme.colors.criticalCrimson : MarineTheme.colors.warningAmber}`,
                  borderTop: `1px solid ${MarineTheme.colors.border}`,
                  borderRight: `1px solid ${MarineTheme.colors.border}`,
                  borderBottom: `1px solid ${MarineTheme.colors.border}`,
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertBadge level={alarm.level} />
                  <div>
                    <div style={{ fontWeight: 600, color: MarineTheme.colors.textPrimary }}>
                      [{alarm.code}] {alarm.message}
                    </div>
                    <div style={{ fontSize: '11px', color: MarineTheme.colors.textMuted, marginTop: '2px' }}>
                      {alarm.vesselName} ({alarm.facilityType}) | {new Date(alarm.timestamp).toLocaleTimeString('ko-KR')}
                    </div>
                  </div>
                </div>

                <div>
                  {!alarm.acknowledged ? (
                    <button
                      onClick={() => onAcknowledge(alarm.id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        border: `1px solid ${MarineTheme.colors.border}`,
                        background: 'rgba(0, 245, 212, 0.15)',
                        color: MarineTheme.colors.ecoCyan,
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      확인
                    </button>
                  ) : (
                    <span style={{ fontSize: '11px', color: MarineTheme.colors.textMuted }}>확인됨</span>
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
