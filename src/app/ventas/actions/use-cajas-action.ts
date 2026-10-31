import { inject } from '@angular/core';
import { injectMutation } from '@tanstack/angular-query-experimental';
import type { CrearCajaDto } from '../../api/interfaces/ventas/caja.interface';
import { CajaApi } from '../../api/ventas/caja-api';
import { ToastService } from '../../shared/services/toast/toast.service';

export function useCajas() {
  const api = inject(CajaApi);
  const toast = inject(ToastService);

  const createMutation = injectMutation(() => ({
    mutationFn: (dto: CrearCajaDto) => api.create(dto),
    onSuccess: () => toast.success('Caja creada correctamente.'),
  }));

  return { createMutation };
}
