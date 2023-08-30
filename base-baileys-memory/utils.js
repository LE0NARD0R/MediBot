const { downloadMediaMessage } = require('@adiwajshing/baileys');
const fs = require('node:fs/promises');
const { convertOggMp3 } = require('./services/convert');
const { voiceToText } = require('./services/whisper');
const mongoose = require('mongoose');
const Conv = require('./services/mongo');

const handlerAI = async (ctx) => {
  /**
   * OMITIR
   */
  const buffer = await downloadMediaMessage(ctx, "buffer");
  const pathTmpOgg = `${process.cwd()}/tmp/voice-note-${Date.now()}.ogg`;
  const pathTmpMp3 = `${process.cwd()}/tmp/voice-note-${Date.now()}.mp3`;
  await fs.writeFile(pathTmpOgg, buffer);
  await convertOggMp3(pathTmpOgg, pathTmpMp3);
  const text = await voiceToText(pathTmpMp3);
  return text
  /**
   * OMITIR
   */
};

const dataToBase = async (ctx) => {
  const buffer = await downloadMediaMessage(ctx, 'buffer')
  const response = buffer.toString('base64')
  return response
}

const createMongo = async (ctx) => {
  if (await Conv.exists({name: ctx.pushName})){
    return ('Ya se había creado')
  }else{
    const conv = await Conv.create({
      name : ctx.pushName,
      number : ctx.from,
      role:['assistant'],
      content: ['Eres MediBot un asistente presto a ayudar a los demás con sus problemas de salud, no reemplazas un diagnóstico  médico pero das recomendaciones sobre qué hacer y das un posbile diagóstico médico de manera resumida'],
      image: ['image1'],
      docs: ['doc0'],
    })
    return ('se creó')
  }
  }
  

module.exports = { handlerAI, dataToBase, createMongo };
