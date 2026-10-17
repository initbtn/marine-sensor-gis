import { useState, useEffect, useCallback, useRef } from 'react';
import {
  EdgeControlClient,
  EdgeTelemetryResponse,
  defaultEdgeClient,
} from '../services/edgeControlClient';

export interface UseTelemetryStreamOptions {
  client?: EdgeControlClient;
  autoPoll?: boolean;
  pollIntervalMs?: number;
}

export interface UseTelemetryStreamReturn {
  telemetry: EdgeTelemetryResponse | null;
  isConnected: boolean;
  isSatelliteOnline: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  toggleBypass: (enable?: boolean) => Promise<void>;
  triggerBackwash: (enable?: boolean) => Promise<void>;
  toggleSatellite: (online?: boolean) => Promise<void>;
}

export function useTelemetryStream(
  options: UseTelemetryStreamOptions = {}
): UseTelemetryStreamReturn {
  const {
    client = defaultEdgeClient,
    autoPoll = true,
    pollIntervalMs = 2000,
  } = options;

  const [telemetry, setTelemetry] = useState<EdgeTelemetryResponse | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSatelliteOnline, setIsSatelliteOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await client.fetchLatestTelemetry();
      if (!isMountedRef.current) return;
      setTelemetry(data);
      setIsConnected(true);
      setIsSatelliteOnline(data.controls.satellite_online);
      setError(null);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setIsConnected(false);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [client]);

  const toggleBypass = useCallback(
    async (enable?: boolean) => {
      try {
        await client.sendCommand('BYPASS_TOGGLE', enable);
        await refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      }
    },
    [client, refresh]
  );

  const triggerBackwash = useCallback(
    async (enable?: boolean) => {
      try {
        await client.sendCommand('BACKWASH_TRIGGER', enable);
        await refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      }
    },
    [client, refresh]
  );

  const toggleSatellite = useCallback(
    async (online?: boolean) => {
      try {
        await client.sendCommand('SATELLITE_TOGGLE', online);
        await refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      }
    },
    [client, refresh]
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (autoPoll) {
      refresh();
      const interval = setInterval(refresh, pollIntervalMs);
      return () => {
        isMountedRef.current = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [autoPoll, pollIntervalMs, refresh]);

  return {
    telemetry,
    isConnected,
    isSatelliteOnline,
    isLoading,
    error,
    refresh,
    toggleBypass,
    triggerBackwash,
    toggleSatellite,
  };
}
