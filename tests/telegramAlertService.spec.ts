import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendTelegramAlert,
  formatTelegramAlertMessage,
  TelegramAlertPayload,
} from '../src/services/telegramAlertService';

describe('telegramAlertService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('멀티 프로젝트 식별을 위해 [marine-sensor-gis] 헤더를 반드시 포함해야 한다', () => {
    const payload: TelegramAlertPayload = {
      level: 'CRITICAL',
      area: '위성 통신 단절',
      message: '해상 위성 링크 단절로 Store-and-Forward 오프라인 큐 전환',
      timestamp: '2026-10-18 08:00:00 KST',
      details: '대기 큐: 12건 적체 중',
    };

    const formatted = formatTelegramAlertMessage(payload);

    expect(formatted).toContain('[marine-sensor-gis]');
    expect(formatted).toContain('선박 친환경 설비 GIS 관제');
    expect(formatted).toContain('위성 통신 단절');
    expect(formatted).toContain('CRITICAL');
  });

  it('토큰과 chat_id가 유효할 때 Telegram Bot API로 메시지를 전송해야 한다', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 12345 } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const payload: TelegramAlertPayload = {
      level: 'WARNING',
      area: 'IMO SOx 규제치 초과',
      message: 'SOx 농도 26.4 ppm 감지 (허용치 25.0 ppm 초과)',
      timestamp: '2026-10-18 08:05:00 KST',
    };

    const result = await sendTelegramAlert(payload, {
      botToken: 'mock-bot-token',
      chatId: 'mock-chat-id',
    });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.telegram.org/botmock-bot-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('[marine-sensor-gis]'),
      })
    );
  });

  it('네트워크 단절이나 API 오류 시 애플리케이션 충돌 없이 실패 상태를 반환해야 한다', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network Offline'));
    vi.stubGlobal('fetch', mockFetch);

    const payload: TelegramAlertPayload = {
      level: 'CRITICAL',
      area: '동기화 큐 오류',
      message: 'Sync Engine 청크 업서트 실패',
      timestamp: '2026-10-18 08:10:00 KST',
    };

    const result = await sendTelegramAlert(payload, {
      botToken: 'mock-bot-token',
      chatId: 'mock-chat-id',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network Offline');
  });

  it('토큰 또는 chat_id가 비어있으면 호출하지 않고 즉시 스킵해야 한다', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const payload: TelegramAlertPayload = {
      level: 'WARNING',
      area: '센서 점검',
      message: '정기 점검 알람',
      timestamp: '2026-10-18 08:15:00 KST',
    };

    const result = await sendTelegramAlert(payload, {
      botToken: '',
      chatId: '',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Telegram credentials not configured');
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
