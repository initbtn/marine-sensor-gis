import React from 'react';
import { MARITIME_PRESETS, MaritimePreset } from '../../services/maritimeAuthService';
import { useMarineDashboardStore } from '../../stores/useMarineDashboardStore';
import {
  ShieldCheck,
  Anchor,
  Wrench,
  Monitor,
  Cpu,
  User,
  X,
  Lock,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

interface MaritimeAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MaritimeAuthModal: React.FC<MaritimeAuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, loginWithPreset, logout } = useMarineDashboardStore();

  if (!isOpen) return null;

  const getPresetIcon = (iconType: string) => {
    switch (iconType) {
      case 'shield':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'anchor':
        return <Anchor className="w-5 h-5 text-cyan-400" />;
      case 'wrench':
        return <Wrench className="w-5 h-5 text-amber-400" />;
      case 'monitor':
        return <Monitor className="w-5 h-5 text-blue-400" />;
      case 'cpu':
        return <Cpu className="w-5 h-5 text-violet-400" />;
      default:
        return <User className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleSelectPreset = async (preset: MaritimePreset) => {
    await loginWithPreset(preset.id);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="maritime-auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-marine-card border border-marine-border rounded-2xl w-full max-w-xl p-6 shadow-2xl overflow-hidden flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-marine-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-marine-cyan/30 text-marine-cyan">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="maritime-auth-modal-title"
                className="text-lg font-bold text-marine-primary"
              >
                선급 &amp; 산업체 표준 사이버보안 인증
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                IACS UR E26/E27 및 IMO MSC.428(98) Zero-PII 인증 아키텍처
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Session Status */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-xs text-slate-400">현재 활성 세션 식별자</div>
              <div className="text-sm font-mono font-bold text-cyan-300">
                {currentUser?.userHashId || '미발급'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="marine-chip text-xs">
              {currentUser?.organizationName || '선급 미등록'} · {currentUser?.title}
            </span>
            {!currentUser?.isAnonymousGuest && (
              <button
                type="button"
                onClick={handleLogout}
                className="marine-btn text-xs bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>세션 해제</span>
              </button>
            )}
          </div>
        </div>

        {/* Zero-PII Compliance Notice Banner */}
        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-3 text-xs text-emerald-200/90 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-300">Zero-PII 무결성 보장: </span>
            본 인증은 실명, 이메일, 전화번호, 원본 IP를 절대 수집·저장하지 않으며, 단방향 암호화 난수 해시(
            <code className="text-cyan-300 bg-slate-900/80 px-1 py-0.5 rounded">usr_****</code>) 세션 토큰만으로 안전하게 운영됩니다.
          </div>
        </div>

        {/* 1-Click Role Presets */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-slate-300 tracking-wider uppercase">
            선급 및 산업체 1-클릭 인증 선택
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MARITIME_PRESETS.map((preset) => {
              const isSelected =
                currentUser?.organization === preset.organization &&
                currentUser?.role === preset.role &&
                currentUser?.isAnonymousGuest === (preset.id === 'GUEST');

              return (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={`preset-btn-${preset.id}`}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 border-marine-cyan shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {getPresetIcon(preset.iconType)}
                      <span className="text-xs font-bold text-slate-100">
                        {preset.name}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-marine-cyan bg-cyan-950/80 px-1.5 py-0.5 rounded border border-marine-cyan/40">
                        인증됨
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 m-0">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
