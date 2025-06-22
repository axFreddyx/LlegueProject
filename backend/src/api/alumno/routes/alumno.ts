/**
 * alumno router
*/

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::alumno.alumno');

// export default {
//   routes: [
//     {
//       method: 'GET',
//       path: '/alumno',
//       handler: 'alumno.find',
//       config: {
//         policies: [],
//       },
//     },
//   ],
// };


// export default {
//     method : "GET",
//     path : "/alumnos",
//     handler : "alumno.find"
// }
