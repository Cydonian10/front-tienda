export interface CreateProductDto {
  nombre: string;
  descripcion: string;
  unidadBaseId: string;
  activo: boolean;
  imagenes: File[];
}

export interface UpdateProductDto extends Omit<CreateProductDto, 'imagenes'> {
  imagenesConservarIds?: string[];
  imagenes?: File[];
}

export interface ProductImage {
  id: string;
  imagenId: string;
  orden: number;
  esPrincipal: boolean;
}

export interface ProductResponse {
  id: string;
  nombre: string;
  descripcion: string | null;
  unidadBaseId: string;
  activo: boolean;
  puedeCambiarUnidadBase: boolean;
  imagenes: ProductImage[];
}

export interface ProductoSeleccion {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface ProductosPagina {
  items: ProductoSeleccion[];
  page: number;
  limit: number;
  totalItems: number;
}

export interface Unidad {
  id: string;
  nombre: string;
  simbolo: string;
}

export interface AtributoProducto {
  atributoId: string;
  atributo: string;
  productoId: string | null;
}
