/**
 * alumno router
*/

import { factories } from '@strapi/strapi';

// export default factories.createCoreRouter('api::alumno.alumno');

export default {
    method : "GET",
    path : "/alumnos",
    handler : "alumno.find"
}
