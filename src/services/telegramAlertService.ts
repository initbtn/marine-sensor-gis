/**
 * Marine Sensor GIS — Telegram Alert Webhook Service
 * 
 * 멀티 프로젝트 공용 봇 정책 준수:
 * 반드시 `[marine-sensor-gis]` 프로젝트 식별 헤더를 명시하여
 * 다른 프로젝트(`busan-youth-day` 등)와의 채널 혼선을 방지합니다.
 */

export interface TelegramAlertPayload {
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  area: string;
  message: string;
  timestamp?: string;
  details?: string;
  environment?: string;
}

export interface TelegramCredentials {
  botToken: string;
  chatId: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatTelegramAlertMessage(payload: TelegramAlertPayload): string {
  const env = escapeHtml(payload.environment || 'PROD');
  const time = escapeHtml(payload.timestamp || new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
  const icon = payload.level === 'CRITICAL' ? '🚨' : payload.level === 'WARNING' ? '⚠️' : 'ℹ️';

  let text = `${icon} [marine-sensor-gis] [${payload.level}] (${env})\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `• 프로젝트: marine-sensor-gis (선박 친환경 설비 GIS 관제)\n`;
  text += `• 감지 영역: ${escapeHtml(payload.area)}\n`;
  text += `• 발생 시각: ${time}\n`;
  text += `• 상세 내용: ${escapeHtml(payload.message)}\n`;
  if (payload.details) {
    text += `• 부가 정보: ${escapeHtml(payload.details)}\n`;
  }
  text += `━━━━━━━━━━━━━━━━━━━━`;

  return text;
}

export async function sendTelegramAlert(
  payload: TelegramAlertPayload,
  credentials?: TelegramCredentials
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const botToken = credentials?.botToken || '';
  const chatId = credentials?.chatId || '';

  if (!botToken || !chatId) {
    return {
      success: false,
      error: 'Telegram credentials not configured',
    };
  }

  const text = formatTelegramAlertMessage(payload);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Telegram API error: ${response.status} ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.result?.message_id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error occurred while sending Telegram alert',
    };
  }
}
