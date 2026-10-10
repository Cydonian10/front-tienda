import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { SystemMenuGroup } from '../../models/system-menu.model';
import { SystemMenuService } from './system-menu.service';

export const systemMenuResolver: ResolveFn<readonly SystemMenuGroup[]> = (route) => {
  const systemCode = route.data['systemCode'];
  if (typeof systemCode !== 'string') return [];

  return inject(SystemMenuService).menuFor(systemCode);
};
