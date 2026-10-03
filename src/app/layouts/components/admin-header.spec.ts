import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminHeader } from './admin-header';

describe('AdminHeader', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('derives initials from the first and last names and updates them when the name changes', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(AdminHeader);
    fixture.componentRef.setInput('menuControlId', 'admin-navigation');
    fixture.componentRef.setInput('userName', '  María   del   Río  ');
    fixture.detectChanges();

    expect(fixture.componentInstance.userInitials()).toBe('MR');

    fixture.componentRef.setInput('userName', 'José');
    fixture.detectChanges();
    expect(fixture.componentInstance.userInitials()).toBe('J');

    fixture.componentRef.setInput('userName', '   ');
    fixture.detectChanges();
    expect(fixture.componentInstance.userInitials()).toBe('AD');
  });
});
