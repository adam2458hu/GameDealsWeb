// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  siteURL: 'http://localhost:3000',
  /*
  apiUsersURL: 'http://192.168.1.2:3000/api/users',
  apiGamesURL: 'http://192.168.1.2:3000/api/games',
  apiCurrenciesURL: 'http://192.168.1.2:3000/api/currencies',
  apiStoresURL: 'http://192.168.1.2:3000/api/stores',
  apiArticlesURL: 'http://192.168.1.2:3000/api/articles',*/
  apiUsersURL: 'http://localhost:3000/api/users',
  apiGamesURL: 'http://localhost:3000/api/games',
  apiCurrenciesURL: 'http://localhost:3000/api/currencies',
  apiStoresURL: 'http://localhost:3000/api/stores',
  apiArticlesURL: 'http://localhost:3000/api/articles',
  PUBLIC_VAPID: 'BDtA1qkTIC506t6RQ78ZLCAV1mfQGUwIMjAh4TAkyP22CCcWJsnPUj4reD_jd9wZyMNjjyWA861Zsq--27FLHKs'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
