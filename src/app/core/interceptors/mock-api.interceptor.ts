import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { handleMockApiRequest, resetMockApiStateForTests } from './mock-api.store';

export { resetMockApiStateForTests };

export function mockApiInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const response = handleMockApiRequest(req);
  return response ?? next(req);
}
