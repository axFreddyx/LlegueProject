/**
 * alumno controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::alumno.alumno',{
    async find(ctx){
        console.log(ctx)
    }
});
