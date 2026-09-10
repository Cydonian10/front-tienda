import { Pipe, PipeTransform } from '@angular/core';
import { DateTime } from 'luxon';

const BUSINESS_TIME_ZONE = 'America/Lima';

@Pipe({ name: 'businessDate' })
export class BusinessDatePipe implements PipeTransform {
  transform(value: string | null | undefined, format = 'dd/MM/yyyy, HH:mm'): string {
    if (!value) return '';
    const date = DateTime.fromISO(value, { setZone: true });
    return date.isValid ? date.setZone(BUSINESS_TIME_ZONE).toFormat(format) : '';
  }
}
