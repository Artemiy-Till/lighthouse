import { useQuery } from '@tanstack/react-query';

import { authenticateMax, getMaxIntegrationStatus } from '../../api/client';
import { getMaxPlatform } from '../../platform/max/max-platform';

export function useMaxConnection() {
  const platform = getMaxPlatform();
  const initData = platform.initData;
  const integration = useQuery({
    queryFn: getMaxIntegrationStatus,
    queryKey: ['max-integration-status'],
    staleTime: 60_000,
  });
  const session = useQuery({
    enabled: Boolean(platform.isAvailable && initData),
    queryFn: () => authenticateMax(initData ?? ''),
    queryKey: ['max-session'],
    retry: false,
    staleTime: 5 * 60_000,
  });

  return { integration, platform, session };
}
