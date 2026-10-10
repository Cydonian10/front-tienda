import { inject } from '@angular/core';
import { SystemApi } from '../../api/access-control/system-api';
import { injectQuery } from '@tanstack/angular-query-experimental';

export const findSystemsQueryKey = ['Find-Systems'] as const;

export function useSystemsQuery() {
  const systemApi = inject(SystemApi);
  return injectQuery(() => ({
    queryKey: [...findSystemsQueryKey],
    queryFn: () => systemApi.findAllSystems(),
    staleTime: 30_000,
    retry: false,
  }));
}
