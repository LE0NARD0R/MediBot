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

const flowHola = addKeyword([
  "hola",
  "ole",
  "buenos",
  "buenas",
  "ola",
]).addAnswer("Saludos! Estás hablando con MediBot, espero serte de ayuda",);

/*async (_, { flowDynamic }) => {
    console.log("🙉 texto a voz....");
    const path = await textToVoice("Cómo se encuentra el día de hoy?");
    console.log(`🙉 Fin texto a voz....[PATH]:${path}`);
    await flowDynamic([{ body: "escucha", media: path }]);
  }*/

const flowVoiceNote = addKeyword(EVENTS.VOICE_NOTE).addAction(
  async (ctx, ctxFn) => {
    await ctxFn.flowDynamic('Buenas '+ ctx.pushName + ' dame un momento para escucharte...🙉' );
    console.log("🤖 voz a texto....");
    const text = await handlerAI(ctx);
    console.log(`🤖 Fin voz a texto....: ${text}`);
    const response = await responseIA(text, ctx);
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

main();
