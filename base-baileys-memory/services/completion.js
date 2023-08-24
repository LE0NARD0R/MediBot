const { Configuration, OpenAIApi } = require("openai");
const mongoose = require('mongoose');
const Conv = require('./mongo');



const responseIA = async (text, ctx) => {

    // if (await Conv.exist({name: ctx.pushName})){
    //   const conv = Conv.findOne({name: ctx.pushName})
    //   conv.role.push('user')
    //   conv.content.push(text)
    //   conv.save()
    //   console.log(conv)
    // }else {
    //   const conv = await Conv.create({
    //     name : ctx.pushName,
    //     number : ctx.from,
    //     role:['assistant', 'user'],
    //     content: ['Eres MediBot un asistente presto a ayudar a los demás con sus problemas de salud, no reemplazas un diagnóstico  médico pero das recomendaciones sobre qué hacer y das un posbile diagóstico médico', 'Te voy a dar unos síntomas, sin reemplazar el diagnóstico médico dame recomendaciones y qué enfermedad puedo estar presentando de manera resumida. Máximo 200 palabras. Los síntomas son los siguientes: ' + text]
    //   })
    //   console.log(conv)
    // }
    

  const conversation = [
    {
      role: "assistant",
      content:
        'Eres MediBot un asistente presto a ayudar a los demás con sus problemas de salud, no reemplazas un diagnóstico  médico pero das recomendaciones sobre qué hacer y das un posbile diagóstico médico'
    },
  ]

  conversation.push({
    role: 'user',
    content : 'Te voy a dar unos síntomas, sin reemplazar el diagnóstico médico dame recomendaciones y qué enfermedad puedo estar presentando de manera resumida. Máximo 200 palabras. Los síntomas son los siguientes: ' + text,
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
