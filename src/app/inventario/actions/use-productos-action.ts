import { inject } from '@angular/core';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { ProductoApi, type CreateProductDto } from '../../api/inventario/product-api';
import { ToastService } from '../../shared/services/toast/toast.service';

export function useProductoApi() {
  const apiProducto = inject(ProductoApi);
  const toast = inject(ToastService);

  const crearMutation = injectMutation(() => ({
    mutationFn: (dto: CreateProductDto) => apiProducto.create(dto),
    onSuccess: () => {
      toast.success('Producto creado correctamente.');
    },
  }));

  return {
    crearMutation,
  };
}
