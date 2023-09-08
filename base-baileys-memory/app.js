require("dotenv").config();
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URL)

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
const { handlerAI, dataToBase, createMongo } = require("./utils");
const { responseIA } = require("./services/completion");
const { textToVoice } = require("./services/eventlab");
const Conv = require('./services/mongo');

const interactions =  ['Quiero asegurarte que he recibido tus mensajes y estoy aquí para escuchar y comprender tus inquietudes médicas.', 'Quiero que sepas que estoy aquí para escucharte. Tu descripción y los audios que has compartido son importantes para entender mejor tu situación de salud.', 'Quiero que sepas que estoy aquí para brindarte apoyo y responder a tus preguntas de manera comprensiva.', 'Estoy trabajando en revisar los detalles para proporcionarte una evaluación precisa. Por favor, ten paciencia mientras proceso la información.', 'Estoy aquí para colaborar contigo en tu camino hacia el bienestar.']
voiceid =['21m00Tcm4TlvDq8ikWAM', 'XB0fDUnXU5powFXDhCwa', '2EiwWnXFnvU5JabPnv8n', 'AZnzlk1XvdvUeBnXmlld', 'CYw3kZ02Hs0563khs1Fj', 'D38z5RcWu1voky8WS1ja']

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
      await ctxFn.flowDynamic('Por favor espera un momento mientras te escucho')
      console.log('existe')
    }else{
      const phrase = getRandomItem(interactions)
      await ctxFn.flowDynamic('¡Hola! '+ ctx.pushName + ' gracias por contactar a MediBot. ' + phrase );
    }    
    console.log("🤖 voz a texto....");
    const text = await handlerAI(ctx);
    console.log(`🤖 Fin voz a texto....: ${text}`);
    const response = await responseIA(text, ctx);
    const id = await Conv.findOne({name: ctx.pushName}, 'id')
    const conv = await Conv.findById(id)
    conv.role.push('assistant')
    conv.content.push(response)
    await conv.save()
    await ctxFn.flowDynamic(response);
    // const voiceId = getRandomItem(voiceid);
    const path = await textToVoice(response)
    console.log('el path es: ' + path)
    // await ctxFn.flowDynamic([{ body: "escucha", media: path }])
    
  }
);

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
