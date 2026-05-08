import { useEffect, useState } from 'react';
import { fetchHealth } from '../services/dashboard-service';

export function useDashboardHealth() {
  const [data, setData] = useState<{ name: string; status: string; timestamp: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void fetchHealth()
      .then((response) => {
        if (active) {
          setData(response);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    data,
    loading,
  };
}
