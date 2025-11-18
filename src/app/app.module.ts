import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideZoneChangeDetection } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    AppComponent,
  ],
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch(), withInterceptors([mockApiInterceptor]))
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
