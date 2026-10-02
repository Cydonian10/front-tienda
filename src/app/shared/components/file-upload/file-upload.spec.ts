import { TestBed } from '@angular/core/testing';
import { FileUpload } from './file-upload';

describe('FileUpload', () => {
  afterEach(() => TestBed.resetTestingModule());

  function setup() {
    const fixture = TestBed.createComponent(FileUpload);
    fixture.detectChanges();
    return { fixture, upload: fixture.componentInstance };
  }

  function file(name = 'documento.pdf', size = 3, type = 'application/pdf'): File {
    return new File(['x'.repeat(size)], name, { type, lastModified: 1 });
  }

  it('renders a native picker and an accessible alternative to drag and drop', () => {
    const { fixture } = setup();
    const host = fixture.nativeElement as HTMLElement;
    const picker = host.querySelector<HTMLInputElement>('input[type=file]')!;
    const open = vi.spyOn(picker, 'click');
    host.querySelector<HTMLButtonElement>('button')!.click();
    expect(open).toHaveBeenCalledOnce();
    expect(host.querySelector('[aria-live=polite]')).not.toBeNull();
    expect(host.querySelector('[role=alert]')).not.toBeNull();
    expect(host.querySelector('button')?.getAttribute('aria-describedby')).toContain('-rules');
  });

  it('replaces a single selection but preserves it after a rejected selection', () => {
    const { fixture, upload } = setup();
    fixture.componentRef.setInput('accept', '.pdf');
    fixture.detectChanges();
    const original = file();
    upload.addFiles([original]);
    upload.addFiles([file('invalid.exe')]);
    expect(upload.files()).toEqual([original]);
    const replacement = file('replacement.pdf');
    upload.addFiles([replacement]);
    expect(upload.files()).toEqual([replacement]);
    expect(upload.errors()).toEqual([]);
  });

  it('accumulates files, ignores duplicates and rejects excess files', () => {
    const { fixture, upload } = setup();
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('maxFiles', 2);
    fixture.detectChanges();
    const first = file();
    upload.addFiles([first, first, file('second.pdf'), file('third.pdf')]);
    expect(upload.files()).toHaveLength(2);
    expect(upload.errors().map((item) => item.reason)).toEqual(['count']);
  });

  it('validates extensions, exact MIME, wildcard MIME and file size', () => {
    const { fixture, upload } = setup();
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('accept', '.PDF, image/*, text/plain');
    fixture.componentRef.setInput('maxFileSize', 4);
    fixture.detectChanges();
    upload.addFiles([
      file('DOCUMENT.PDF', 4, ''), file('image.png', 2, 'image/png'),
      file('notes.txt', 1, 'text/plain'), file('large.pdf', 5), file('bad.exe', 1, ''),
    ]);
    expect(upload.files()).toHaveLength(3);
    expect(upload.errors().map((item) => item.reason)).toEqual(['size', 'type']);
  });

  it('emits accepted values and rejection details separately', () => {
    const { fixture, upload } = setup();
    fixture.componentRef.setInput('accept', '.pdf');
    fixture.detectChanges();
    const change = vi.fn();
    const rejected = vi.fn();
    upload.filesChange.subscribe(change);
    upload.filesRejected.subscribe(rejected);
    const valid = file();
    upload.addFiles([valid, file('bad.exe')]);
    expect(change).toHaveBeenCalledExactlyOnceWith([valid]);
    expect(rejected.mock.calls[0][0][0].reason).toBe('type');
  });

  it('supports writing, changing, touching, resetting and disabling form values', () => {
    const { fixture, upload } = setup();
    const change = vi.fn();
    const touched = vi.fn();
    upload.registerOnChange(change);
    upload.registerOnTouched(touched);
    upload.writeValue([file()]);
    expect(change).not.toHaveBeenCalled();
    upload.addFiles([file('new.pdf')]);
    expect(change).toHaveBeenCalledOnce();
    expect(touched).toHaveBeenCalledOnce();
    upload.setDisabledState(true);
    fixture.detectChanges();
    upload.addFiles([file('blocked.pdf')]);
    upload.remove(0);
    expect(upload.files()[0].name).toBe('new.pdf');
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    upload.writeValue(null);
    expect(upload.files()).toEqual([]);
  });

  it('prevents navigation on drop and selects dropped files', () => {
    const { upload } = setup();
    const preventDefault = vi.fn();
    const dropped = file();
    upload.onDrop({ preventDefault, dataTransfer: { files: [dropped] } } as unknown as DragEvent);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(upload.files()).toEqual([dropped]);
    expect(upload.dragging()).toBe(false);
  });

  it('keeps the drag highlight while moving between child elements', () => {
    const { upload } = setup();
    const event = { preventDefault: vi.fn(), dataTransfer: { types: ['Files'] } } as unknown as DragEvent;
    upload.onDragEnter(event);
    upload.onDragEnter(event);
    upload.onDragLeave(event);
    expect(upload.dragging()).toBe(true);
    upload.onDragLeave(event);
    expect(upload.dragging()).toBe(false);
  });

  it('resets the native picker so the same file can be selected again', () => {
    const { upload } = setup();
    const input = { files: [file()], value: 'fakepath/documento.pdf' };
    upload.onInput({ target: input } as unknown as Event);
    expect(input.value).toBe('');
    expect(upload.files()).toHaveLength(1);
  });

  it('removes files from the UI and returns focus to the selection button', () => {
    const { fixture, upload } = setup();
    upload.addFiles([file('<img src=x>.pdf')]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    fixture.nativeElement.querySelector('button[aria-label^="Quitar"]').click();
    fixture.detectChanges();
    expect(upload.files()).toEqual([]);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('button'));
  });
});
