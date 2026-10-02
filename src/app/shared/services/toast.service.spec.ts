import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('exposes the four notification types with semantic default titles', () => {
    const toast = TestBed.inject(ToastService);
    toast.success('Guardado');
    toast.info('Nueva versión', { title: 'Actualización' });
    toast.warning('Revisar datos');
    expect(toast.notifications().map((item) => item.type)).toEqual(['success', 'info', 'warning']);
    expect(toast.notifications()[1].title).toBe('Actualización');
    toast.clear();
    toast.error('Intenta otra vez');
    expect(toast.notifications()[0].title).toBe('No se pudo completar');
  });

  it('expires temporary messages but keeps errors and explicit persistent messages', () => {
    const toast = TestBed.inject(ToastService);
    toast.success('Guardado');
    toast.error('Intenta nuevamente');
    toast.info('Información persistente', { duration: 0 });
    vi.advanceTimersByTime(5000);
    expect(toast.notifications().map((item) => item.type)).toEqual(['error', 'info']);
    const id = toast.warning('Aviso breve', { duration: 1000 });
    vi.advanceTimersByTime(1000);
    expect(toast.notifications().some((item) => item.id === id)).toBe(false);
  });

  it('starts queued message lifetimes only after they become visible', () => {
    const toast = TestBed.inject(ToastService);
    const first = toast.info('Uno', { duration: 0 });
    toast.info('Dos', { duration: 0 });
    toast.info('Tres', { duration: 0 });
    const queued = toast.info('Cuatro', { duration: 1000 });
    expect(toast.notifications()).toHaveLength(3);
    vi.advanceTimersByTime(5000);
    toast.dismiss(first);
    expect(toast.notifications().at(-1)?.id).toBe(queued);
    vi.advanceTimersByTime(999);
    expect(toast.notifications().at(-1)?.id).toBe(queued);
    vi.advanceTimersByTime(1);
    expect(toast.notifications()).toHaveLength(2);
  });

  it('preserves remaining time and waits for both pointer and focus to leave', () => {
    const toast = TestBed.inject(ToastService);
    const id = toast.success('Guardado', { duration: 5000 });
    vi.advanceTimersByTime(1000);
    toast.pause(id, 'pointer');
    toast.pause(id, 'focus');
    vi.advanceTimersByTime(10000);
    toast.resume(id, 'pointer');
    vi.advanceTimersByTime(10000);
    expect(toast.notifications()).toHaveLength(1);
    toast.resume(id, 'focus');
    vi.advanceTimersByTime(3999);
    expect(toast.notifications()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toast.notifications()).toHaveLength(0);
  });

  it('pauses while the tab is hidden and resumes with the remaining time', () => {
    const hidden = vi.spyOn(document, 'hidden', 'get');
    const toast = TestBed.inject(ToastService);
    toast.info('Información', { duration: 5000 });
    vi.advanceTimersByTime(1000);
    hidden.mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(20000);
    expect(toast.notifications()).toHaveLength(1);
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(4000);
    expect(toast.notifications()).toHaveLength(0);
  });

  it('cleans up all queued messages and timers', () => {
    const toast = TestBed.inject(ToastService);
    for (let i = 0; i < 5; i++) toast.success(`Mensaje ${i}`);
    toast.clear();
    expect(toast.notifications()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    toast.success('Nuevo');
    TestBed.resetTestingModule();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not enqueue messages or start timers during SSR', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const toast = TestBed.inject(ToastService);
    toast.success('No debe renderizarse');
    expect(toast.notifications()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
