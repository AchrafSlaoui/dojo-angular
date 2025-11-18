import { Pipe, PipeTransform } from '@angular/core';

/**
 * formatValue pipe
 * Standardises value rendering (text, phone, number, currency).
 * Examples:
 *  - Text uppercase: {{ v | formatValue:'text':true }}
 *  - French phone: {{ tel | formatValue:'phone' }}
 *  - Number with 3 decimals: {{ num | formatValue:'number':3 }}
 *  - Currency (defaults to euro): {{ amount | formatValue:'currency':undefined:2 }}
 */
@Pipe({
  name: 'formatValue',
  standalone: true,
  pure: true,
})
export class FormatValuePipe implements PipeTransform {
  private static readonly FALLBACK = '-';

  transform(
    value: unknown,
    mode?: 'text' | 'phone' | 'number' | 'currency',
    opt?: any,
    opt2?: any,
    fallback?: string
  ): string {
    const resolvedFallback = this.resolveFallback(fallback);
    switch (mode) {
      case 'phone':
        return this.formatPhone(value, resolvedFallback);
      case 'number':
      case 'currency':
        return this.formatNumber(value, mode === 'currency', opt, opt2, resolvedFallback);
      case 'text':
        return this.formatText(value, opt, resolvedFallback);
      default:
        return this.basic(value, resolvedFallback);
    }
  }

  private resolveFallback(fallback?: string): string {
    const trimmed = (fallback ?? '').trim();
    return trimmed.length ? trimmed : FormatValuePipe.FALLBACK;
  }

  private basic(v: unknown, fallback: string): string {
    if (v == null) return fallback;
    const s = String(v).trim();
    return s.length ? s : fallback;
  }

  private formatText(v: unknown, uppercase: boolean | string | undefined, fallback: string): string {
    const s = this.basic(v, fallback);
    if (s === fallback) return s;
    const up = uppercase === true || uppercase === 'upper' || uppercase === 'uppercase' || uppercase === 'Maj';
    return up ? s.toUpperCase() : s;
  }

  private formatNumber(
    v: unknown,
    withCurrency: boolean,
    opt: any,
    opt2: any,
    fallback: string
  ): string {
    const num = typeof v === 'number' ? v : Number(v);
    if (!isFinite(num)) return fallback;
    let decimals = 2;
    let symbol = '\u20AC';
    if (typeof opt === 'number') decimals = opt;
    if (typeof opt2 === 'number') decimals = opt2;
    if (typeof opt === 'string') symbol = opt;
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
    return withCurrency ? `${formatted} ${symbol}` : formatted;
  }

  private formatPhone(v: unknown, fallback: string): string {
    const raw = String(v ?? '').trim();
    if (!raw) return fallback;
    const clean = raw.replace(/[^+\d]/g, '');
    if (clean.startsWith('+33')) {
      const d = clean.slice(3).replace(/^0/, '');
      return '+33 ' + this.groupFR(d);
    }
    if (clean.startsWith('0033')) {
      const d = clean.slice(4).replace(/^0/, '');
      return '+33 ' + this.groupFR(d);
    }
    const digits = clean.replace(/\D/g, '');
    if (/^0\d{9}$/.test(digits)) {
      return this.groupFR(digits);
    }
    return raw || fallback;
  }

  private groupFR(d: string): string {
    const s = d.replace(/\D/g, '');
    const parts: string[] = [];
    for (let i = 0; i < s.length; i += 2) parts.push(s.slice(i, i + 2));
    return parts.join(' ').trim();
  }
}
