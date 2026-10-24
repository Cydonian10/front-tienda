import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { MarcaApi } from '../../../../api/inventario/marca-api';
import { MarcaImagen } from './marca-imagen';

describe('MarcaImagen', () => {
  it('consulta el blob autenticado y revoca su URL al cerrar; error no oculta la marca', async () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const revoke = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:autenticada') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
    const getImage = vi.fn().mockResolvedValueOnce(new Blob(['foto'])).mockRejectedValueOnce(new Error('404'));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    try {
      TestBed.configureTestingModule({ providers: [
        provideTanStackQuery(client), { provide: MarcaApi, useValue: { getImage } },
      ] });
      const fixture = TestBed.createComponent(MarcaImagen);
      fixture.componentRef.setInput('id', 'm1');
      fixture.componentRef.setInput('imagenId', 'i1');
      fixture.componentRef.setInput('nombre', 'Atlas');
      fixture.detectChanges();
      await vi.waitFor(() => expect(fixture.componentInstance.url()).toBe('blob:autenticada'));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('img').alt).toBe('Imagen de Atlas');
      expect(getImage).toHaveBeenCalledWith('m1');
      fixture.componentRef.setInput('imagenId', 'i2');
      fixture.detectChanges();
      await vi.waitFor(() => expect(fixture.componentInstance.query.isError()).toBe(true));
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Imagen no disponible');
      expect(revoke).toHaveBeenCalledWith('blob:autenticada');
      fixture.destroy();
    } finally {
      client.clear();
      TestBed.resetTestingModule();
      Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreate });
      Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevoke });
    }
  });
});
