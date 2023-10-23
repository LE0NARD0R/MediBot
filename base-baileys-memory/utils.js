const { downloadMediaMessage } = require('@adiwajshing/baileys');
const fs = require('node:fs/promises');
const { convertOggMp3 } = require('./services/convert');
const { voiceToText } = require('./services/whisper');
const mongoose = require('mongoose');
const Conv = require('./models/userModel');

const handlerAI = async (ctx) => {
  
  const buffer = await downloadMediaMessage(ctx, "buffer");
  const pathTmpOgg = `${process.cwd()}/tmp/voice-note-${Date.now()}.ogg`;
  const pathTmpMp3 = `${process.cwd()}/tmp/voice-note-${Date.now()}.mp3`;
  await fs.writeFile(pathTmpOgg, buffer);
  await convertOggMp3(pathTmpOgg, pathTmpMp3);
  const text = await voiceToText(pathTmpMp3);
  return text
};

const dataToBase = async (ctx) => {
  const buffer = await downloadMediaMessage(ctx, 'buffer')
  const response = buffer.toString('base64')
  return response
}

async function baseToImg(data) {
    return new Promise( (resolve) => {
      const pathFile = `${process.cwd()}/tmp/${Date.now()}-image.jpeg`
      const binaryData = Buffer.from(data, 'base64')
      fs.writeFile(pathFile, binaryData)
      resolve(pathFile)
    })
}

async function baseToDoc(data) {
  return new Promise( (resolve) => {
    const pathFile = `${process.cwd()}/tmp/${Date.now()}-document.pdf`
    const binaryData = Buffer.from(data, 'base64')
    fs.writeFile(pathFile, binaryData)
    resolve(pathFile)
  })
}

const createMongo = async (ctx) => {
  if (await Conv.exists({name: ctx.pushName})){
    return ('Ya se había creado')
  }else{
    const conv = await Conv.create({
      name : ctx.pushName,
      number : ctx.from,
      role:['assistant'],
      content: ['Eres MediBot un asistente presto a ayudar a los demás con sus problemas de salud, no reemplazas un diagnóstico  médico pero das recomendaciones sobre qué hacer y das un posbile diagóstico médico en máximo 100 palabras. Sólo debes responder preguntas asociadas con el ámbito médico, si alguien pregunta algo fuera del ámbito médico debes decir que no puedes responder su pregunta. Además, puedes recibir imágenes, exámenes y pdf, no los analizas, pero si los guardas.'],
    })
    return ('se creó')
  }
  }

const createDate = (completeDate, text = 'Hora de la consulta: ') => {
  const year = completeDate.getFullYear();
  const month = String(completeDate.getMonth() + 1).padStart(2, '0');
  const day = String(completeDate.getDate()).padStart(2, '0');
  const hour = String(completeDate.getHours()).padStart(2, '0');
  const minute = String(completeDate.getMinutes()).padStart(2, '0');

  const date = `${text} ${year}/${month}/${day} - ${hour}:${minute}`;
  return date;
}
  
module.exports = { handlerAI, dataToBase, createMongo, createDate, baseToImg, baseToDoc };