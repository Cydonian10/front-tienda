import { inject } from '@angular/core';
import { RolesApi } from '../../../api/access-control/roles-api';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { CreateRolDto } from '../../../api/interfaces/access-control/role.interface';

export function CreateRolMutation() {
  const apiRol = inject(RolesApi);

  return injectMutation(() => ({
    mutationFn: (dto: CreateRolDto) => apiRol.create(dto),
    onSuccess: (data) => {},
  }));
}
