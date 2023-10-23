require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URL);
const AWS = require("aws-sdk");
AWS.config.loadFromPath("./config.json");

const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  addAnswer,
  EVENTS,
} = require("@bot-whatsapp/bot");

const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const MockAdapter = require("@bot-whatsapp/database/mock");
const { handlerAI, dataToBase, createMongo, createDate, baseToImg, baseToDoc } = require("./utils");
const { responseIA, resumeIA, medicResumeIA} = require("./services/completion");
const { textToSpeech } = require("./services/polly");
const Conv = require("./models/userModel");
const medic = require("./models/medicModel");

const interactions = [
  "Quiero asegurarte que he recibido tus mensajes y estoy aquí para escuchar y comprender tus inquietudes médicas.",
  "Quiero que sepas que estoy aquí para escucharte. Tu descripción y los audios que has compartido son importantes para entender mejor tu situación de salud.",
  "Quiero que sepas que estoy aquí para brindarte apoyo y responder a tus preguntas de manera comprensiva.",
  "Estoy trabajando en revisar los detalles para proporcionarte una evaluación precisa. Por favor, ten paciencia mientras proceso la información.",
  "Estoy aquí para colaborar contigo en tu camino hacia el bienestar.",
];
const voiceid = ["Lupe", "Penelope", "Miguel"];
let code = 0;

const flowResumen = addKeyword('resumen').addAction(async (ctx, ctxFn) => {
  try {
    const id = await Conv.findOne({ name: ctx.pushName }, "id");
    const conv = await Conv.findById(id, 'image uploadImage docs uploadDocs');

    //Get back the images
    for (i in conv.image){
      const path = await baseToImg(conv.image[i])
      ctxFn.flowDynamic([{ body: `${conv.uploadImage[i]}`, media: path }])
    }

    //Get back the docs
    for (d in conv.docs){
      const path = await baseToDoc(conv.docs[d])
      ctxFn.flowDynamic([{ body: `${conv.uploadDocs[d]}`, media: path }])
    }

    //Response with the resume
    const response = await resumeIA(ctx);
    const voiceId = getRandomItem(voiceid);
    const path = await textToSpeech(voiceId, response);
    await ctxFn.flowDynamic("*MediBot:* " + response);
    ctxFn.flowDynamic([{ body: "escucha", media: path }]);

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

      await ctxFn.flowDynamic("*MediBot:* " + response);
      ctxFn.flowDynamic([{ body: "escucha", media: path }]);
      

    } catch (error) {
      console.error("Error en el flujo de voz:", error);
    }
  }
);

// modificar el prompt para que deje de ser tan jodon con la insistencia.
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

const flowMedico = addKeyword(['medico', 'médico']).addAnswer('*Ingrese su código*', {capture: true}, async (ctx, {fallBack, flowDynamic, gotoFlow}) => {
  try {
    if (medic.exists({code: ctx.body})){
      code = ctx.body
      const id = await medic.findOne({ code: code}, "id")
      const medico = await medic.findById(id)
      const patients = []
      for (p in medico.patients){
      patients.push(medico.patients[p])
      }
      if (patients.length != 0){
        await flowDynamic(`Bienvenido ${medico.name}, es un gusto tenerlo de vuelta. \n Sus pacientes son: *${patients}*. `)
        await gotoFlow(flowPatientSelection)
      }else {
        await flowDynamic('No tiene pacientes')
      }
      
    } else {
      await flowDynamic('*Código errado, vuelva a intentar*')
      fallBack()
    }
  } catch (error) {
    console.error("Error en el flujo del médico:", error);
  }
})

const flowTextResponse = addKeyword(EVENTS.WELCOME).addAction(
  async (ctx,ctxFn) => {
    try{
      // In the following block of code we validate if a the message received already exits
      const conversationExists = await Conv.exists({ name: ctx.pushName});
      
      if (conversationExists){
        await ctxFn.flowDynamic("*MediBot:* Por favor, espera un momento.");
        console.log("La conversación ya existe");
      }else{
        const phrase = getRandomItem(interactions);
        const welcomeMessage = `*MediBot:* ¡Hola! ${ctx.pushName}, gracias por contactar a MediBot. ${phrase}`;
        await ctxFn.flowDynamic(welcomeMessage);
      }
      //Here we instantiate a Date() object 
      const completeDate = new Date();
      const date = createDate(completeDate);

      // In the next block of code we show in the terminal the text message received from the patient
      console.log("🤖 Texto recibido....")
      const receivedText = ctx.body;
      const userMessage = `*${ctx.pushName}:* ${receivedText}`;
      await ctxFn.flowDynamic(userMessage);
      console.log(`🤖 Fin Texto recibido....: ${receivedText}`);

      //Finally we are going to send a response to the text request patient
      const response = await responseIA(receivedText, ctx, date);
      const voiceId = getRandomItem(voiceid);
      const path = await textToSpeech(voiceId, response);

      await ctxFn.flowDynamic("*MediBot:* " + response);
      ctxFn.flowDynamic([{ body: "escucha", media: path }]);

    }
    catch (error){
      console.error("Error en el flujo:", error);
    }
  }
);

const flowPatientSelection = addKeyword('PATIENT_SELECTION').addAnswer('Escriba el nombre del paciente del cuál quiere un resumen.', {capture: true}, async (ctx, {fallBack, flowDynamic, gotoFlow}) => {
  const id = await medic.findOne({ code: code}, "id")
  const medico = await medic.findById(id)

  try {
    if (medico.patients.includes(ctx.body)){
      // aquí estoy, crear la función que haga el resumen del paciente que se pida: medicResumeIA
  
      const id = await Conv.findOne({ name: ctx.body }, "id");
      const conv = await Conv.findById(id, 'image uploadImage docs uploadDocs');
  
      for (i in conv.image){
        const path = await baseToImg(conv.image[i])
        await flowDynamic([{ body: `${conv.uploadImage[i]}`, media: path }])
      }
  
      //Get back the docs
      for (d in conv.docs){
        const path = await baseToDoc(conv.docs[d])
        await flowDynamic([{ body: `${conv.uploadDocs[d]}`, media: path }])
      }
  
      const resp = await medicResumeIA(ctx.body)
      const response = resp.data.choices[0].message.content
      const voiceId = getRandomItem(voiceid);
      const path = await textToSpeech(voiceId, response);
      await flowDynamic("*MediBot:* " + response);
      await flowDynamic([{ body: "escucha", media: path }]);
    }else{
      await flowDynamic('El nombre que ingresó no hace parte de la lista de sus pacientes.')
      fallBack()
    }
  } catch (error) {
    console.error("Error en info pacientes:", error);
  }
})

const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([ flowVoiceNote, flowImage, flowDoc, flowResumen, flowTextResponse, flowMedico, flowPatientSelection ]);
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