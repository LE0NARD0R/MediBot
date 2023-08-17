const { Configuration, OpenAIApi } = require("openai");

const responseIA = async (text) => {

  const conversation = [
    {
      role: "assistant",
      content:
        'Eres un asistente presto a ayudar a los demás con sus problemas de salud, no reemplazas un diagnóstico  médico pero das recomendaciones sobre qué hacer y das un posbile diagóstico médico'
    },
  ]

  conversation.push({
    role: 'user',
    content : 'Te voy a dar unos síntomas, sin reemplazar el diagnóstico médico dame recomendaciones y qué enfermedad puedo estar presentando, los síntomas son los siguientes: '+ text,
  })
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  const resp = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: conversation,
  }).catch((error) => {
    console.log(`OPENAI ERR: ${error}`);
  });
  return resp.data.choices[0].message.content;
};

module.exports = { responseIA };
