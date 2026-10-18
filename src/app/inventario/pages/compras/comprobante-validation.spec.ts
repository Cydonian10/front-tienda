import { comprobanteError, MAX_COMPROBANTE_BYTES } from './comprobante-validation';

describe('validación opcional de comprobante', () => {
  it('acepta PDF, JPG y PNG y el tamaño exacto de 10 MiB', () => {
    const pdf = new File(['x'], 'FACTURA.PDF', { type: 'application/pdf' });
    Object.defineProperty(pdf, 'size', { value: MAX_COMPROBANTE_BYTES });
    expect(comprobanteError(pdf)).toBeNull();
    expect(comprobanteError(new File(['x'], 'foto.jpeg', { type: 'image/jpeg' }))).toBeNull();
    expect(comprobanteError(new File(['x'], 'imagen.png', { type: 'image/png' }))).toBeNull();
  });

  it('rechaza tamaño vacío o excesivo y extensión/MIME incompatible', () => {
    expect(comprobanteError(new File([], 'vacio.pdf', { type: 'application/pdf' }))).toContain(
      'vacío',
    );
    const grande = new File(['x'], 'grande.jpg', { type: 'image/jpeg' });
    Object.defineProperty(grande, 'size', { value: MAX_COMPROBANTE_BYTES + 1 });
    expect(comprobanteError(grande)).toContain('10 MB');
    expect(comprobanteError(new File(['x'], 'falso.pdf', { type: 'image/png' }))).toContain(
      'PDF, JPG o PNG',
    );
    expect(comprobanteError(new File(['x'], 'datos.csv', { type: 'text/csv' }))).toContain(
      'PDF, JPG o PNG',
    );
  });
});
