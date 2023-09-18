require("dotenv").config();
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URL)
const AWS = require('aws-sdk')
AWS.config.loadFromPath('./config.json')
const fs = require('fs');



const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  addAnswer,
  EVENTS,
} = require("@bot-whatsapp/bot");

const QRPortalWeb = require("@bot-whatsapp/portal");
const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const MockAdapter = require("@bot-whatsapp/database/mock");
const { handlerAI, dataToBase, createMongo, createDate } = require("./utils");
const { responseIA } = require("./services/completion");
// const { textToVoice } = require("./services/eventlab");
const { textToSpeech } = require('./services/polly')
const Conv = require('./services/mongo');

const interactions =  ['Quiero asegurarte que he recibido tus mensajes y estoy aquí para escuchar y comprender tus inquietudes médicas.', 'Quiero que sepas que estoy aquí para escucharte. Tu descripción y los audios que has compartido son importantes para entender mejor tu situación de salud.', 'Quiero que sepas que estoy aquí para brindarte apoyo y responder a tus preguntas de manera comprensiva.', 'Estoy trabajando en revisar los detalles para proporcionarte una evaluación precisa. Por favor, ten paciencia mientras proceso la información.', 'Estoy aquí para colaborar contigo en tu camino hacia el bienestar.']
voiceid =['Lupe', 'Penelope', 'Miguel']



const flowHola = addKeyword([
  "hola",
  "ole",
  "buenos",
  "buenas",
  "ola",
  'ayuda',
  'siento',
]).addAction(
  async (ctx, ctxFn) => {
    await ctxFn.flowDynamic("Saludos! Estás hablando con MediBot. Envíame un audio con tus síntomas para poder ayudarte")
    console.log(ctx)
  }
);
// colocarle nuevos triggers.

const flowVoiceNote = addKeyword(EVENTS.VOICE_NOTE).addAction(
  async (ctx, ctxFn) => {
    if(await Conv.exists({name: ctx.pushName})){
      await ctxFn.flowDynamic('*MediBot:* Por favor espera un momento mientras te escucho')
      console.log('existe')
    }else{
      const phrase = getRandomItem(interactions)
      await ctxFn.flowDynamic('*MediBot:* ¡Hola! '+ ctx.pushName + ' gracias por contactar a MediBot. ' + phrase );
    }    
    console.log("🤖 voz a texto....");
    const completeDate = new Date()
    const date = createDate( completeDate )
    console.log('Hora de la consulta: ' + date)
    
    // const text = await handlerAI(ctx);
    // await ctxFn.flowDynamic('*'+ ctx.pushName + ':* ' + text);
    // console.log(`🤖 Fin voz a texto....: ${text}`);
    // const response = await responseIA(text, ctx, date);

    // const response = 'si funciona, ganamos';
    // const voiceId = getRandomItem(voiceid)
    // const path = await textToSpeech(voiceId, response)

    // const id = await Conv.findOne({name: ctx.pushName}, 'id')
    // const conv = await Conv.findById(id)
    // conv.role.push('assistant')
    // conv.content.push(response)
    // await conv.save()
    // await ctxFn.flowDynamic('*MediBot:* ' + response );

    // console.log('path:' + path)
    // let time = 0;
    // for (let i = 0; i < 1000000000000000; i++) {
    //   if (i === 90000000){
    //     setTimeout(() => {
    //       time = 1
    //     }, 1000)
    //   }
    // }
    
    // console.log(time)

    // if (path){
    //   try{
    //     ctxFn.flowDynamic([{ body: "escucha", media: path }])
    //   }catch(e){
    //     console.log(e)
    //   }
    // }
    // ctxFn.flowDynamic([{ body: "escucha", media: path }])
    
    
    
  }
);

// guardarle la hora a las imagénes y documetos guardados.
// agregarle un código al médico para tener los síntomas de los pacientes.
// recuperar las fotos
// agregarle un flow que sea el flow del médico para conexión por parte del médico
// vamos a almacear las fechas de interacción

// Agregar guardar imágenes a la respuesta de la inteligencia artificial
const flowImage = addKeyword(EVENTS.MEDIA).addAction(
  async(ctx, ctxFn) => {
    console.log('Imagen')
    await ctxFn.flowDynamic('¡Hola! '+ ctx.pushName + ' gracias por contactar a MediBot. Estamos almacenando su imagen');
    const mdb = await createMongo(ctx)
    console.log(mdb)
    const img = await dataToBase(ctx)
    const id = await Conv.findOne({name: ctx.pushName}, 'id')
    const conv = await Conv.findById(id)
    conv.image.push(img)
    conv.save()
    await ctxFn.flowDynamic('Hemos guardado tu imagen')
  }
)

const flowDoc = addKeyword(EVENTS.DOCUMENT).addAction(
  async(ctx, ctxFn) => {
    console.log('Documentos')
    await ctxFn.flowDynamic('¡Hola! '+ ctx.pushName + ' gracias por contactar a MediBot. Estamos almacenando su documento');
    const mdb = await createMongo(ctx)
    console.log(mdb)
    const doc = await dataToBase(ctx)
    const id = await Conv.findOne({name: ctx.pushName}, 'id')
    const conv = await Conv.findById(id)
    conv.docs.push(doc)
    conv.save()
    await ctxFn.flowDynamic('Hemos guardado tu documento')
  }
)

// const flowAdd = 

const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([flowHola, flowVoiceNote, flowImage, flowDoc]);
  const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();
};
function getRandomItem(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  const item = arr[randomIndex];
  return item;
}

main();
