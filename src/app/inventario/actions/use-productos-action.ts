import { inject } from '@angular/core';
import { injectMutation } from '@tanstack/angular-query-experimental';

import { ToastService } from '../../shared/services/toast/toast.service';
import { ProductoApi } from '../../api/inventario/product-api';
import type {
  CreateProductDto,
  UpdateProductDto,
} from '../../api/interfaces/inventario/producto.interface';

export function useProductoApi() {
  const apiProducto = inject(ProductoApi);
  const toast = inject(ToastService);

  const crearMutation = injectMutation(() => ({
    mutationFn: (dto: CreateProductDto) => apiProducto.create(dto),
    onSuccess: () => {
      toast.success('Producto creado correctamente.');
    },
  }));

  const actualizarMutation = injectMutation(() => ({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductDto }) => apiProducto.update(id, dto),
    onSuccess: () => toast.success('Producto actualizado correctamente.'),
  }));

  return {
    crearMutation,
    actualizarMutation,
  };
}
