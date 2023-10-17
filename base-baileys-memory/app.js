require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URL);
const AWS = require("aws-sdk");
AWS.config.loadFromPath("./config.json");
const fs = require("fs");

const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  addAnswer,
  EVENTS,
} = require("@bot-whatsapp/bot");

const keywords = [
  "Hola",
  "Adiós",
  "Por favor",
  "Gracias",
  "Lo siento",
  "Sí",
  "No",
  "Cómo",
  "Bien",
  "Mal",
  "Amigo",
  "Familia",
  "Trabajo",
  "Casa",
  "Comida",
  "Café",
  "Agua",
  "Tiempo",
  "Hoy",
  "Mañana",
  "Tarde",
  "Noche",
  "Ayuda",
  "Dinero",
  "Feliz",
  "Triste",
  "Amor",
  "Odio",
  "Risa",
  "Llorar",
  "Internet",
  "Teléfono",
  "Mensaje",
  "Foto",
  "Video",
  "Música",
  "Libro",
  "Pregunta",
  "Respuesta",
  "Hombre",
  "Mujer",
  "Niño",
  "Niña",
  "Compañero",
  "Reunión",
  "Salir",
  "Comprar",
  "Vender",
  "ole",
  "buenos",
  "buenas",
  "ola",
  "ayuda",
  "siento",
  "puede",
  "puedo",
  "foto",
  "zona",
  "poder",
];

const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const MockAdapter = require("@bot-whatsapp/database/mock");
const { handlerAI, dataToBase, createMongo, createDate, baseToImg, baseToDoc } = require("./utils");
const { responseIA, resumeIA } = require("./services/completion");
const { textToSpeech } = require("./services/polly");
const Conv = require("./services/mongo");

const interactions = [
  "Quiero asegurarte que he recibido tus mensajes y estoy aquí para escuchar y comprender tus inquietudes médicas.",
  "Quiero que sepas que estoy aquí para escucharte. Tu descripción y los audios que has compartido son importantes para entender mejor tu situación de salud.",
  "Quiero que sepas que estoy aquí para brindarte apoyo y responder a tus preguntas de manera comprensiva.",
  "Estoy trabajando en revisar los detalles para proporcionarte una evaluación precisa. Por favor, ten paciencia mientras proceso la información.",
  "Estoy aquí para colaborar contigo en tu camino hacia el bienestar.",
];
voiceid = ["Lupe", "Penelope", "Miguel"];

const flowHola = addKeyword('resumen').addAction(async (ctx, ctxFn) => {
  try {
    let i = 0
    let d = 0

    const id = await Conv.findOne({ name: ctx.pushName }, "id");
    const conv = await Conv.findById(id, 'image uploadImage docs uploadDocs');

    //Get back the images
    for (img in conv.image){
      const path = await baseToImg(conv.image[i])
      ctxFn.flowDynamic([{ body: `${conv.uploadImage[i]}`, media: path }])
      i+=1
    }

    //Get back the docs
    for (doc in conv.docs){
      const path = await baseToDoc(conv.docs[d])
      ctxFn.flowDynamic([{ body: `${conv.uploadDocs[d]}`, media: path }])
      d += 1
    }

    //Response with the resume
    const response = await resumeIA(ctx);
    await ctxFn.flowDynamic("*MediBot:* " + response);
  }catch (error) {
    console.error("Error al recuperar las imágenes:", error);
  }
});

const flowVoiceNote = addKeyword(EVENTS.VOICE_NOTE).addAction(
  async (ctx, ctxFn) => {
    try {
      const conversationExists = await Conv.exists({ name: ctx.pushName });

      if (conversationExists) {
        await ctxFn.flowDynamic(
          "*MediBot:* Por favor, espera un momento mientras te escucho"
        );
        
        console.log("La conversación ya existe");
      } else {
        const phrase = getRandomItem(interactions);
        const welcomeMessage = `*MediBot:* ¡Hola! ${ctx.pushName} gracias por contactar a MediBot. ${phrase}`;
        await ctxFn.flowDynamic(welcomeMessage);
      }
      
      const completeDate = new Date();
      const date = createDate(completeDate);

      console.log("🤖 Voz a texto....");
      const text = await handlerAI(ctx);
      const userMessage = `*${ctx.pushName}:* ${text}`;
      await ctxFn.flowDynamic(userMessage);
      console.log(`🤖 Fin voz a texto....: ${text}`);

      const response = await responseIA(text, ctx, date);
      const voiceId = getRandomItem(voiceid);
      const path = await textToSpeech(voiceId, response);

      const id = await Conv.findOne({ name: ctx.pushName }, "id");
      const conv = await Conv.findById(id);

      await ctxFn.flowDynamic("*MediBot:* " + response);
      ctxFn.flowDynamic([{ body: "escucha", media: path }]);
      

    } catch (error) {
      console.error("Error en el flujo de voz:", error);
    }
  }
);

// modificar el prompt para que deje de ser tan jodon con la insistencia.
// agregarle un código al médico para tener los síntomas de los pacientes.
// recuperar los documentos
// agregarle un flow que sea el flow del médico para conexión por parte del médico

// Agregar guardar imágenes a la respuesta de la inteligencia artificial
const flowImage = addKeyword(EVENTS.MEDIA).addAction(async (ctx, ctxFn) => {
  console.log("Imagen");
  const imgConsult = 'Imagen guardada el: '
  await ctxFn.flowDynamic(
    "¡Hola! " +
      ctx.pushName +
      " gracias por contactar a MediBot. Estamos almacenando su imagen"
  );
  const mdb = await createMongo(ctx);
  console.log(mdb);
  const img = await dataToBase(ctx);
  const id = await Conv.findOne({ name: ctx.pushName }, "id");
  const conv = await Conv.findById(id);
  const completeDate = new Date();
  const date = createDate(completeDate, imgConsult);
  conv.image.push(img);
  conv.uploadImage.push(date);
  conv.save();
  await ctxFn.flowDynamic("Hemos guardado tu imagen");
});

const flowDoc = addKeyword(EVENTS.DOCUMENT).addAction(async (ctx, ctxFn) => {
  console.log("Documentos");
  const docConsult = 'Documento guardado el: '
  await ctxFn.flowDynamic(
    "¡Hola! " +
      ctx.pushName +
      " gracias por contactar a MediBot. Estamos almacenando su documento"
  );
  const mdb = await createMongo(ctx);
  console.log(mdb);
  const doc = await dataToBase(ctx);
  const id = await Conv.findOne({ name: ctx.pushName }, "id");
  const conv = await Conv.findById(id);
  const completeDate = new Date();
  const date = createDate(completeDate, docConsult);
  conv.docs.push(doc);
  conv.uploadDocs.push(date);
  conv.save();
  await ctxFn.flowDynamic("Hemos guardado tu documento");
});

// const flowAdd =

const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([ flowVoiceNote, flowImage, flowDoc, flowHola]);
  const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });
};

function getRandomItem(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  const item = arr[randomIndex];
  return item;
}

main();