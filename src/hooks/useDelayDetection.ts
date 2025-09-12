// hooks/useDelayDetection.ts
import { useState, useEffect } from 'react';
import { DelayDetectionService, DelayAlert } from '../services/delayDetectionService';

export const useDelayDetection = () => {
  const [delays, setDelays] = useState<DelayAlert[]>([]);
  const [delaysByArea, setDelaysByArea] = useState<Record<string, DelayAlert[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDelays();
  }, []);

  const loadDelays = async () => {
    try {
      setLoading(true);
      const [currentDelays, areaDelays] = await Promise.all([
        DelayDetectionService.getCurrentDelays(),
        DelayDetectionService.getDelaysByArea()
      ]);

      setDelays(currentDelays);
      setDelaysByArea(areaDelays);
    } catch (err) {
      setError('Failed to load delay data');
      console.error('Error loading delays:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    delays,
    delaysByArea,
    loading,
    error,
    refreshDelays: loadDelays
  };
};