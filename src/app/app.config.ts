import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
// 1. Importas el proveedor de HTTP
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // 2. Lo agregas aquí en los providers
    provideHttpClient()
  ]
};