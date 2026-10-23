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
      const vessel = { ...INITIAL_VESSELS[0] }; // VSL-001, lat: 34.85, lng: 128.75, speed: 18.4, heading: 215 (SW)
      const initialPos = { ...vessel.position };

      // Advance by 60 seconds (with reasonable simulation scale)
      const next = calculateDeadReckoningPosition(vessel, 60);

      // Heading 215 is South-West: lat should decrease (South), lng should decrease (West)
      expect(next.position.lat).toBeLessThan(initialPos.lat);
      expect(next.position.lng).toBeLessThan(initialPos.lng);
      expect(next.headingDeg).toBe(215);
      expect(next.compassDirection).toBe('SW');
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
