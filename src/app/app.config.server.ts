import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { ENVIRONMENT } from './api/config/env-dev';
import { environment } from '../environments/environment';
import { apiUrlFromEnvironment } from './api/config/runtime-config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: ENVIRONMENT, useFactory: () => ({ apiUrl: apiUrlFromEnvironment(process.env['API_URL']) ?? environment.apiUrl }) },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
