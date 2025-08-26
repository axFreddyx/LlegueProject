const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = require("./llegue-a2155-firebase-adminsdk-fbsvc-97353971ea.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default {

  async afterCreate(event) {
    const { result } = event;
    try {
      console.log("afterCreate event:", result);

      const llegada = await strapi.db.query("api::llegada.llegada").findOne({
        where: { id: result.id },
        populate: { docente: true, alumno:true }, // asegúrate que la relación se llama 'cliente'
      });

      if (!llegada.docente || !llegada.docente.token_push) {
        strapi.log.warn("Docentes sin token");
        return;
      }
     
      
      const message = {
        token: llegada.docente.token_push,
        notification: {
          title: "Aviso de llegada",
          body:`Han llegado por ${llegada.alumno.nombre}`,
        },
      };

      await admin.messaging().send(message);
    } catch (err) {
      strapi.log.error("Error enviando notificación push:", err);
    }



  },
};