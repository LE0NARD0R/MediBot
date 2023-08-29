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
const { handlerAI } = require("./utils");
const { responseIA } = require("./services/completion");
const { textToVoice } = require("./services/eventlab");
const Conv = require('./services/mongo');

const interactions =  ['Quiero asegurarte que he recibido tus mensajes y estoy aquí para escuchar y comprender tus inquietudes médicas.', 'Quiero que sepas que estoy aquí para escucharte. Tu descripción y los audios que has compartido son importantes para entender mejor tu situación de salud.', 'Quiero que sepas que estoy aquí para brindarte apoyo y responder a tus preguntas de manera comprensiva.', 'Estoy trabajando en revisar los detalles para proporcionarte una evaluación precisa. Por favor, ten paciencia mientras proceso la información.', 'Estoy aquí para colaborar contigo en tu camino hacia el bienestar.']

const flowHola = addKeyword([
  "hola",
  "ole",
  "buenos",
  "buenas",
  "ola",
  'ayuda',
  'siento',
]).addAnswer("Saludos! Estás hablando con MediBot. Envíame un audio con tus síntomas",);

/*async (_, { flowDynamic }) => {
    console.log("🙉 texto a voz....");
    const path = await textToVoice("Cómo se encuentra el día de hoy?");
    console.log(`🙉 Fin texto a voz....[PATH]:${path}`);
    await flowDynamic([{ body: "escucha", media: path }]);
  }*/
// colocarle nuevos triggers.


const flowVoiceNote = addKeyword(EVENTS.VOICE_NOTE).addAction(
  async (ctx, ctxFn) => {
    const phrase = getRandomItem(interactions)
    await ctxFn.flowDynamic('¡Hola! '+ ctx.pushName + ' gracias por contactar a MediBot. ' + phrase );
    console.log("🤖 voz a texto....");
    const text = await handlerAI(ctx);
    console.log(`🤖 Fin voz a texto....: ${text}`);
    const response = await responseIA(text, ctx);
    const id = await Conv.findOne({name: ctx.pushName}, '_id')
    const conv = await Conv.findById(id)
    conv.role.push('assistant')
    conv.content.push(response)
    await conv.save()
    const path = await textToVoice(response)
    await ctxFn.flowDynamic([{ body: "escucha", media: path }])
    // await ctxFn.flowDynamic(response);
  }
);
const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([flowHola, flowVoiceNote]);
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
