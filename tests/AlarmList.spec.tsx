import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlarmList } from '../src/components/Dashboard/AlarmList';
import { AlarmEvent } from '../src/types/telemetry';

describe('AlarmList Component Tests', () => {
  it('알람이 없을 때 빈 상태 안내 메시지를 표시해야 한다', () => {
    const handleAck = vi.fn();
    render(<AlarmList alarms={[]} onAcknowledge={handleAck} />);

    expect(screen.getByText(/현재 감지된 설비 이상 또는 규제 위반 경보가 없습니다/)).toBeInTheDocument();
  });

  it('알람 발생 시 메시지를 표시하고 확인 버튼 클릭 시 핸들러가 호출되어야 한다', () => {
    const handleAck = vi.fn();
    const mockAlarms: AlarmEvent[] = [
      {
        id: 'ALM-1',
        vesselId: 'VSL-001',
        vesselName: 'PANAMAX PIONEER',
        facilityType: 'SCRUBBER',
        level: 'CRITICAL',
        code: 'SCRUB-001',
        message: '배출 세정수 산성도 기준치 미달 (pH 6.2 < 6.5)',
        timestamp: new Date().toISOString(),
        acknowledged: false,
      },
    ];

    render(<AlarmList alarms={mockAlarms} onAcknowledge={handleAck} />);

    expect(screen.getByText(/배출 세정수 산성도 기준치 미달/)).toBeInTheDocument();
    const ackButton = screen.getByRole('button', { name: '확인' });
    expect(ackButton).toBeInTheDocument();

    fireEvent.click(ackButton);
    expect(handleAck).toHaveBeenCalledWith('ALM-1');
  });
});
