import React from 'react';
import { MarineMap } from '../Map/MarineMap';
import { useMarineDashboardStore } from '../../stores/useMarineDashboardStore';

export const FullGisPage: React.FC = () => {
  const { vessels, selectedVesselId, setSelectedVesselId, trackHistories } = useMarineDashboardStore();
  const selectedVessel = vessels.find((v) => v.id === selectedVesselId) || vessels[0];

  return (
    <div className="flex flex-col gap-4 text-slate-100" data-testid="full-gis-page">
      <div className="bg-marine-card rounded-xl p-4 border border-marine-border shadow-md">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-marine-border flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-marine-primary">
              🗺️ 전 해역 선단 GIS 관제 및 전자해도 (ENC) 추적
            </h2>
            {selectedVessel && (
              <span className="marine-chip text-xs">
                현재 추적선: {selectedVessel.name} ({selectedVessel.imoNumber})
              </span>
            )}
          </div>
          <span className="text-xs text-marine-secondary">
            선박 위치 및 침로 실시간 데드레커닝 연동 중 ({vessels.length}척 활성)
          </span>
        </div>
        <div className="rounded-lg overflow-hidden border border-slate-700/60 h-[calc(100vh-250px)] min-h-[500px]">
          <MarineMap
            vessels={vessels}
            selectedVessel={selectedVessel}
            onSelectVessel={setSelectedVesselId}
            trackHistory={selectedVessel ? trackHistories[selectedVessel.id] : undefined}
          />
        </div>
      </div>
    </div>
  );
};
