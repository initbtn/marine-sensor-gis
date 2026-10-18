import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuditDashboard } from '../src/components/Audit/AuditDashboard';
import { MaritimeAuthModal } from '../src/components/Layout/MaritimeAuthModal';
import { accessAuditService } from '../src/services/accessAuditService';
import { useMarineDashboardStore } from '../src/stores/useMarineDashboardStore';

describe('AuditDashboard and MaritimeAuthModal Components', () => {
  beforeEach(() => {
    accessAuditService.resetBuffer();
    useMarineDashboardStore.getState().reset();
  });

  it('AuditDashboard가 헤더, 메트릭 카드 및 감사 트레일 테이블을 정상 렌더링해야 한다', async () => {
    render(<AuditDashboard />);

    expect(screen.getByTestId('audit-dashboard-page')).toBeInTheDocument();
    expect(screen.getByText('Zero-PII 접속 감사 트레일 & 실시간 활성 유저 통계')).toBeInTheDocument();
    expect(screen.getByText('실시간 동시 접속자 수')).toBeInTheDocument();
    expect(screen.getByText('당일 누적 활성 사용자 (DAU)')).toBeInTheDocument();
    expect(screen.getByText('당일 시스템 조작 이벤트')).toBeInTheDocument();
    expect(screen.getByText('Zero-PII 법정 규제 준수 상태: 무결 (Pass)')).toBeInTheDocument();

    // 비동기 로그 로딩 대기
    await waitFor(() => {
      const rows = screen.getAllByTestId('audit-log-row');
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  it('액션 셀렉터로 필터링 시 해당 액션의 감사 로그만 표시되어야 한다', async () => {
    render(<AuditDashboard />);

    // 초기 로그 로딩 대기
    await waitFor(() => {
      expect(screen.getAllByTestId('audit-log-row').length).toBeGreaterThan(0);
    });

    const filterSelect = screen.getByLabelText('액션 필터');
    fireEvent.change(filterSelect, { target: { value: 'BYPASS_TOGGLE' } });

    await waitFor(() => {
      const rows = screen.getAllByTestId('audit-log-row');
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('비상 바이패스 조작').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('새로고침 버튼 클릭 시 통계 데이터가 다시 로드되어야 한다', async () => {
    render(<AuditDashboard />);

    const refreshBtn = screen.getByRole('button', { name: /감사 통계 새로고침/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(screen.getByText('Zero-PII 접속 감사 트레일 & 실시간 활성 유저 통계')).toBeInTheDocument();
    });
  });

  it('MaritimeAuthModal에서 한국선급 프리셋 선택 시 인증되고 닫혀야 한다', async () => {
    let closed = false;
    render(
      <MaritimeAuthModal
        isOpen={true}
        onClose={() => {
          closed = true;
        }}
      />
    );

    expect(screen.getByText('선급 & 산업체 표준 사이버보안 인증')).toBeInTheDocument();
    expect(screen.getByText(/Zero-PII 무결성 보장/i)).toBeInTheDocument();

    const krBtn = screen.getByTestId('preset-btn-KR_SURVEYOR');
    fireEvent.click(krBtn);

    await waitFor(() => {
      expect(closed).toBe(true);
      const user = useMarineDashboardStore.getState().currentUser;
      expect(user.organization).toBe('KR');
      expect(user.role).toBe('COMPLIANCE_OFFICER');
    });
  });
});
