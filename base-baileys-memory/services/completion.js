const { Configuration, OpenAIApi } = require("openai");
const mongoose = require('mongoose');
const Conv = require('./mongo');


const responseIA = async (text, ctx) => {

  // create or save the new interaction of the user
  let i = 0
  const conversation = []
  if (await Conv.exists({name: ctx.pushName})){
    const id = await Conv.findOne({name: ctx.pushName}, '_id')
    const conv = await Conv.findById(id)
    conv.role.push('user')
    conv.content.push('Estos son mis siguientes síntomas'+ text + 'espero tus recomendaciones y tu posible diagnóstio en máximo 100 palabras.')    
    await conv.save()
  } else {
      const conv = await Conv.create({
        name : ctx.pushName,
        number : ctx.from,
        role:['assistant', 'user'],
        content: ['Eres MediBot un asistente presto a ayudar a los demás con sus problemas de salud, no reemplazas un diagnóstico  médico pero das recomendaciones sobre qué hacer y das un posbile diagóstico médico de manera resumida. Sólo debes responder preguntas asociadas con el ámbito médico, si alguien pregunta algo fuera del ámbito médico debes decir que no puedes responder su pregunta. Además, puedes recibir imágenes, exámenes y pdf, no los analizas, pero si los guardas.', 'Te voy a dar unos síntomas, sin reemplazar el diagnóstico médico dame recomendaciones y qué enfermedad puedo estar presentando de manera resumida. Máximo 100 palabras. Los síntomas son los siguientes: '+ text],
        image: ['image1'],
        docs: ['doc0']
    })
  }

  // falta agregar el límite de las interacciones que quiero rescatar
  const id = await Conv.findOne({name: ctx.pushName}, '_id')
  const conv = await Conv.findById(id, 'role content')
  for (conver in conv.role){      
    conversation.push({
      role: conv.role[i],
      content: conv.content[i],
    })
    i += 1;
  }
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
