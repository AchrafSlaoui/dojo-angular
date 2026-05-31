import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

const interceptors = environment.useMockApi ? [mockApiInterceptor] : [];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors(interceptors)
    )
  ]
};
