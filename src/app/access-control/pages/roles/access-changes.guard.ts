import { CanDeactivateFn } from '@angular/router';
import RolesPage from './roles.page';

export const accessChangesGuard: CanDeactivateFn<RolesPage> = (page) => page.confirmNavigation();
