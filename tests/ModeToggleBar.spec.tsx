import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModeToggleBar } from '../src/components/Dashboard/ModeToggleBar';

describe('ModeToggleBar', () => {
  const defaultProps = {
    operatingMode: 'EDGE' as const,
    networkStatus: 'ONLINE' as const,
    syncStatus: 'IDLE' as const,
    pendingCount: 5,
    onToggleOperatingMode: vi.fn(),
    onToggleNetworkStatus: vi.fn(),
    onManualFlush: vi.fn(),
  };

  it('선박 에지 모드와 내륙 클라우드 모드가 올바르게 표시되어야 한다', () => {
    render(<ModeToggleBar {...defaultProps} />);

    expect(screen.getByText('🚢 선박 로컬 에지')).toBeInTheDocument();
    expect(screen.getByText('🏢 내륙 클라우드')).toBeInTheDocument();
  });

  it('모드 전환 버튼 클릭 시 onToggleOperatingMode 콜백이 호출되어야 한다', () => {
    const onToggleMode = vi.fn();
    render(<ModeToggleBar {...defaultProps} onToggleOperatingMode={onToggleMode} />);

    const cloudBtn = screen.getByText('🏢 내륙 클라우드');
    fireEvent.click(cloudBtn);

    expect(onToggleMode).toHaveBeenCalledWith('CLOUD');
  });

  it('위성 네트워크 토글 버튼 클릭 시 onToggleNetworkStatus 콜백이 호출되어야 한다', () => {
    const onToggleNetwork = vi.fn();
    render(<ModeToggleBar {...defaultProps} onToggleNetworkStatus={onToggleNetwork} />);

    const networkBtn = screen.getByTestId('network-toggle-btn');
    fireEvent.click(networkBtn);

    expect(onToggleNetwork).toHaveBeenCalled();
  });

  it('Store-and-Forward 대기 큐(PENDING) 건수가 뱃지로 렌더링되어야 한다', () => {
    render(<ModeToggleBar {...defaultProps} pendingCount={42} />);

    expect(screen.getByText('42건 대기')).toBeInTheDocument();
  });

  it('동기화 버튼 클릭 시 onManualFlush 콜백이 호출되어야 한다', () => {
    const onFlush = vi.fn();
    render(<ModeToggleBar {...defaultProps} onManualFlush={onFlush} />);

    const flushBtn = screen.getByRole('button', { name: /즉시 동기화/i });
    fireEvent.click(flushBtn);

    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  it('동기화 진행 중(SYNCING)일 때는 버튼이 비활성화되어야 한다', () => {
    render(<ModeToggleBar {...defaultProps} syncStatus="SYNCING" />);

    const flushBtn = screen.getByRole('button', { name: /동기화 중/i });
    expect(flushBtn).toBeDisabled();
  });
});
