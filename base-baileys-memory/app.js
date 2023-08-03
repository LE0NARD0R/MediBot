require("dotenv").config();

const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  addAnswer,
  EVENTS,
} = require("@bot-whatsapp/bot");

//  const { init } = require("bot-ws-plugin-opneai");
const QRPortalWeb = require("@bot-whatsapp/portal");
const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const MockAdapter = require("@bot-whatsapp/database/mock");
const { handlerAI } = require("./utils");
const { textToVoice } = require("./services/eventlab");

const employeesAddonConfig = {
  model: "gpt-3.5-turbo",
  temperature: 0.2,
  apiKey: process.env.OPENAI_API_KEY,
};
//const employeesAddon = init(employeesAddonConfig);

const flowHola = addKeyword(["hola", "ole", "buenos", "buenas", "ola"]).addAnswer(
  ["Saludos! Estás hablando con MediBot, espero serte de ayuda"],
  null,
  /*async (_, { flowDynamic }) => {
    console.log("🙉 texto a voz....");
    const path = await textToVoice("Cómo se encuentra el día de hoy?");
    console.log(`🙉 Fin texto a voz....[PATH]:${path}`);
    await flowDynamic([{ body: "escucha", media: path }]);
  }*/
);

const flowVoiceNote = addKeyword(EVENTS.VOICE_NOTE).addAction(
  async (ctx, ctxFn) => {
    await ctxFn.flowDynamic("dame un momento para escucharte...🙉");
    console.log("🤖 voz a texto....");
    const text = await handlerAI(ctx);
    console.log(`🤖 Fin voz a texto....[TEXT]: ${text}`);
    

    /*
    const empleado = await employeesAddon.determine(text);

    employeesAddon.gotoFlow(empleado, ctxFn);*/
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
