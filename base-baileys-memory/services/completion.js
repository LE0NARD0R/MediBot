const { Configuration, OpenAIApi } = require("openai");
const mongoose = require('mongoose');
const Conv = require('../models/userModel');


const responseIA = async (text, ctx, date = '0000') => {

  // create or save the new interaction of the user
  const conversation = []
  if (await Conv.exists({name: ctx.pushName})){
    const id = await Conv.findOne({name: ctx.pushName}, '_id')
    const conv = await Conv.findById(id)
    conv.role.push('user')
    conv.content.push('Estos son mis siguientes síntomas'+ text + 'espero tus recomendaciones y tu posible diagnóstio en máximo 100 palabras. ( ' + date + ' )')    
    await conv.save()
  } else {
      const conv = await Conv.create({
        name : ctx.pushName,
        number : ctx.from,
        role:['assistant', 'user'],
        content: ['Eres MediBot un asistente, con memoria, presto a ayudar a los demás con sus problemas de salud, no reemplazas un diagnóstico  médico pero das recomendaciones sobre qué hacer y das un posbile diagóstico médico de manera resumida. Sólo debes responder preguntas asociadas con el ámbito médico, si alguien pregunta algo fuera del ámbito médico debes decir que no puedes responder su pregunta. Además, puedes recibir imágenes, exámenes y pdf, no los analizas, pero si los guardas.', 'Te voy a dar unos síntomas, sin reemplazar el diagnóstico médico dame recomendaciones y qué enfermedad puedo estar presentando de manera resumida. Máximo 100 palabras. Los síntomas son los siguientes: ' + text + '. ( ' + date + ' )'],
    })
  }

  const id = await Conv.findOne({name: ctx.pushName}, '_id')
  const conv = await Conv.findById(id, 'role content')
  const len = conv.role.length

  // Adding interaction limit
  if (len == 38) {
    const assistant = conv.role.shift()
    const content = conv.content.shift()
    conv.role.shift()
    conv.role.shift()
    conv.content.shift()
    conv.content.shift()
    conv.role.unshift(assistant)
    conv.content.unshift(content)
  }

  for (c in conv.role){      
    conversation.push({
      role: conv.role[c],
      content: conv.content[c],
    })
  }

  // Using ChatGPT
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

  // Saving the response
  conv.role.push('assistant')
  conv.content.push(resp.data.choices[0].message.content)
  conv.save()
  return resp.data.choices[0].message.content;
};

const resumeIA = async (ctx) => {
  const conversation = []

  const id = await Conv.findOne({name: ctx.pushName}, '_id')
  const conv = await Conv.findById(id, 'role content')
  const len = conv.role.length

  if (len == 38) {
    const assistant = conv.role.shift()
    const content = conv.content.shift()
    conv.role.shift()
    conv.role.shift()
    conv.content.shift()
    conv.content.shift()
    conv.role.unshift(assistant)
    conv.content.unshift(content)
  }

  conv.role.shift()
  conv.content.shift()

  for (c in conv.role){      
    conversation.push({
      role: conv.role[c],
      content: conv.content[c],
    })
  }

  conversation.push({
    role: 'user',
    content: 'Resume la conversación hasta el moemnto con sus respectivas fechas. Máximo 120 palabras',
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
}

const medicResumeIA = async (name) => {
  const conversation = []

  const id = await Conv.findOne({name: name}, '_id')
  const conv = await Conv.findById(id, 'role content')
  const len = conv.role.length

  if (len == 38) {
    const assistant = conv.role.shift()
    const content = conv.content.shift()
    conv.role.shift()
    conv.role.shift()
    conv.content.shift()
    conv.content.shift()
    conv.role.unshift(assistant)
    conv.content.unshift(content)
  }

  conv.role.shift()
  conv.content.shift()

  for (c in conv.role){      
    conversation.push({
      role: conv.role[c],
      content: conv.content[c],
    })
  }

  conversation.push({
    role: 'user',
    content: 'Resume la conversación hasta el moemnto con sus respectivas fechas. Máximo 120 palabras',
  })

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  return new Promise( (resolve) => {
    const resp = openai.createChatCompletion({
      model: 'gpt-3.5-turbo', 
      messages: conversation,
    }).catch((error) => {
      console.log(`OPENAI ERR: ${error}`);
    });
    resolve(resp)
  })
}


const clasificationIA = async (text) => {

  const conversation = [
    { role: 'assistant', content: 'Debes clasificar cada mensaje como alguna de estas especialidades médicas: Odonotología, Cardiología, Dermatología, Ginecología, Ortopedia, Neurología, Pediatría, Oftalmología, Psiquiatría, Medicina General, Endocrinología' },
    { role: 'user', content: text } 
]

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  return new Promise( (resolve) => {
    const resp = openai.createChatCompletion({
      model: 'gpt-3.5-turbo', 
      messages: conversation,
    }).catch((error) => {
      console.log(`OPENAI ERR: ${error}`);
    });
    resolve(resp)
  })
}

module.exports = { responseIA , resumeIA, medicResumeIA, clasificationIA };