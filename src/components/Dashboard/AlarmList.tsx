import React from 'react';
import { AlarmEvent } from '../../types/telemetry';

interface AlarmListProps {
  alarms: AlarmEvent[];
  onAcknowledge: (alarmId: string) => void;
}

export const AlarmList: React.FC<AlarmListProps> = ({ alarms, onAcknowledge }) => {
  return (
    <div style={{ background: '#ffffff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', marginTop: '16px' }} data-testid="alarm-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>⚠️ 실시간 설비 경보 및 규제 감시 이력</h4>
        <span style={{ fontSize: '12px', color: '#64748b' }}>총 {alarms.length}건</span>
      </div>

      {alarms.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
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
                  background: isCritical ? '#fef2f2' : '#fffbeb',
                  borderLeft: `4px solid ${isCritical ? '#ef4444' : '#f59e0b'}`,
                  fontSize: '13px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: isCritical ? '#991b1b' : '#92400e' }}>
                    [{alarm.facilityType}] {alarm.message}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    선박: {alarm.vesselName} | 코드: {alarm.code} | 발생: {new Date(alarm.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                {!alarm.acknowledged ? (
                  <button
                    onClick={() => onAcknowledge(alarm.id)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: '#475569',
                    }}
                  >
                    확인
                  </button>
                ) : (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>확인됨</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
