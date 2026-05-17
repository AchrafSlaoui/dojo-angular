import { HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export function ok<T>(body: T): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status: 200, body }));
}

export function created<T>(body: T): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status: 201, body }));
}

export function notFound(): Observable<HttpEvent<unknown>> {
  return of(new HttpResponse({ status: 404 }));
}

export function badRequest(): Observable<HttpEvent<unknown>> {
  return of(new HttpResponse({ status: 400 }));
}

export function noContent(): Observable<HttpEvent<unknown>> {
  return of(new HttpResponse({ status: 204 }));
}
