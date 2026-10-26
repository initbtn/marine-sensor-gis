import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCompassDirection16,
  calculateDeadReckoningPosition,
  INITIAL_VESSELS,
} from '../src/services/mockTelemetry';
import { useMarineDashboardStore } from '../src/stores/useMarineDashboardStore';

describe('Vessel Dead Reckoning & Navigation Engine', () => {
  describe('getCompassDirection16', () => {
    it('accurately converts 0 to 360 degrees to 16 cardinal compass directions', () => {
      expect(getCompassDirection16(0)).toBe('N');
      expect(getCompassDirection16(360)).toBe('N');
      expect(getCompassDirection16(22.5)).toBe('NNE');
      expect(getCompassDirection16(45)).toBe('NE');
      expect(getCompassDirection16(90)).toBe('E');
      expect(getCompassDirection16(105)).toBe('ESE');
      expect(getCompassDirection16(180)).toBe('S');
      expect(getCompassDirection16(215)).toBe('SW');
      expect(getCompassDirection16(270)).toBe('W');
      expect(getCompassDirection16(315)).toBe('NW');
    });

    it('handles negative angles and angles greater than 360 degrees', () => {
      expect(getCompassDirection16(-45)).toBe('NW');
      expect(getCompassDirection16(405)).toBe('NE');
    });
  });

  describe('calculateDeadReckoningPosition', () => {
    it('advances vessel latitude and longitude based on speed and heading', () => {
      const vessel = { ...INITIAL_VESSELS[0] }; // VSL-001, Korea Strait TSS, heading: 195 (SSW)
      const initialPos = { ...vessel.position };

      // Advance by 60 seconds (with reasonable simulation scale)
      const next = calculateDeadReckoningPosition(vessel, 60);

      // Heading 195 is South-Southwest: lat should decrease (South), lng should decrease slightly (West)
      expect(next.position.lat).toBeLessThan(initialPos.lat);
      expect(next.position.lng).toBeLessThan(initialPos.lng);
      expect(next.headingDeg).toBe(195);
      expect(next.compassDirection).toBe('SSW');
    });

    it('VSL-001: 부산항 남외항~대한해협 서수로(TSS) 해상 항행 중 육지(거제도/부산도심)를 침범하지 않는다', () => {
      const vsl1 = INITIAL_VESSELS[0];
      // 1. 초기 좌표가 부산 도심 육지나 거제도 육지가 아닌 대한해협 서수로 공해상에 위치하는지 검증
      expect(vsl1.position.lat).toBeLessThanOrEqual(35.05);
      expect(vsl1.position.lat).toBeGreaterThanOrEqual(34.50);
      expect(vsl1.position.lng).toBeGreaterThanOrEqual(129.00);
      expect(vsl1.position.lng).toBeLessThanOrEqual(129.15);
      expect(vsl1.headingDeg).toBe(195);

      // 2. 20 스텝 (100초 데드레커닝) 동안 거제도 동쪽(128.80 이하)이나 대마도(129.25 이상)로 벗어나지 않고 서수로 심해 유지
      let current = { ...vsl1 };
      for (let i = 0; i < 20; i++) {
        const res = calculateDeadReckoningPosition(current, 5);
        current.position = res.position;
      }
      expect(current.position.lat).toBeGreaterThan(34.10);
      expect(current.position.lng).toBeGreaterThanOrEqual(128.85);
      expect(current.position.lng).toBeLessThanOrEqual(129.15);
    });

    it('advances North-East for heading 45', () => {
      const vessel = { ...INITIAL_VESSELS[2] }; // VSL-003, lat: 21.15, lng: 121.5, heading: 45
      const initialPos = { ...vessel.position };

      const next = calculateDeadReckoningPosition(vessel, 60);

      // Heading 45 is North-East: lat should increase (North), lng should increase (East)
      expect(next.position.lat).toBeGreaterThan(initialPos.lat);
      expect(next.position.lng).toBeGreaterThan(initialPos.lng);
      expect(next.headingDeg).toBe(45);
      expect(next.compassDirection).toBe('NE');
    });
  });

  describe('useMarineDashboardStore Navigation & Track History', () => {
    beforeEach(() => {
      useMarineDashboardStore.getState().reset();
    });

    it('initializes trackHistories with default vessel tracks', () => {
      const { trackHistories } = useMarineDashboardStore.getState();
      expect(trackHistories['VSL-001']).toBeDefined();
      expect(trackHistories['VSL-001'].length).toBeGreaterThanOrEqual(4);
    });

    it('updates all vessel positions and appends new point to trackHistories', () => {
      const store = useMarineDashboardStore.getState();
      const initialVessel1Pos = { ...store.vessels[0].position };
      const initialTrackLen = store.trackHistories['VSL-001'].length;

      // Advance positions
      store.advanceVesselPositions(30);

      const updatedStore = useMarineDashboardStore.getState();
      const newVessel1 = updatedStore.vessels[0];
      const newTrack = updatedStore.trackHistories['VSL-001'];

      expect(newVessel1.position.lat).not.toBe(initialVessel1Pos.lat);
      expect(newTrack.length).toBe(initialTrackLen + 1);
      expect(newTrack[newTrack.length - 1].lat).toBe(newVessel1.position.lat);
      expect(newTrack[newTrack.length - 1].lng).toBe(newVessel1.position.lng);
    });

    it('caps trackHistories buffer at 50 points to prevent memory leak', () => {
      // Trigger 60 advances
      for (let i = 0; i < 60; i++) {
        useMarineDashboardStore.getState().advanceVesselPositions(10);
      }

      const updatedTrack = useMarineDashboardStore.getState().trackHistories['VSL-001'];
      expect(updatedTrack.length).toBeLessThanOrEqual(50);
    });
  });
});
