const { downloadMediaMessage } = require('@adiwajshing/baileys');
const fs = require('node:fs/promises');
const { convertOggMp3 } = require('./services/convert');
const { voiceToText } = require('./services/whisper');
const mongoose = require('mongoose');
const Conv = require('./models/userModel');
const medic = require('./models/medicModel')

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
      content: ['Eres MediBot un asistente, con memoria, presto a ayudar a los demás con sus problemas de salud, no reemplazas un diagnóstico  médico pero das recomendaciones sobre qué hacer y das un posbile diagóstico médico de manera resumida. Sólo debes responder preguntas asociadas con el ámbito médico, si alguien pregunta algo fuera del ámbito médico debes decir que no puedes responder su pregunta. Además, puedes recibir imágenes, exámenes y pdf, no los analizas, pero si los guardas.'],
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

const confirmateDoctor = async (ctx) => {
  const id = await Conv.findOne( {name: ctx.pushName}, 'id')
  const conv = await Conv.findById(id, 'doctor name')
  if (conv.doctor){
    return conv.doctor
  }else{
    return false
  }
}

const saveClasification = async (specialty, ctx) => {
  try {
    const medico = await medic.findOne({ specialty: specialty });
    if (medico) {
      // Si se encontró un médico con la especialidad, verifica si ctx.pushName está en la lista de pacientes
      if (!medico.patients.includes(ctx.pushName)) {
        medico.patients.push(ctx.pushName);
        await medico.save(); // Asegúrate de guardar los cambios en la base de datos
      }
    } else {
      // Puedes manejar el caso en el que no se encontró un médico con la especialidad
      console.log(`No se encontró un médico con la especialidad: ${specialty}`);
    }
  } catch (error) {
   console.log(`Se ha producido un error en guardar la clasificación de la especialidad: ${error}`);
  }
}
  

const saveResponse = async (response, specialty, ctx) => {
  try {
    const id = await Conv.findOne({ name: ctx.pushName }, "_id");
    const conv = await Conv.findById(id);

    // Saving the response
    conv.role.push("assistant");
    conv.content.push(response);
    conv.specialty.push(specialty);
    conv.save();
  } catch (error) {
    console.log(`Error al guardar la respuesta: ${error}`)
  }
}
module.exports = { handlerAI, dataToBase, createMongo, createDate, baseToImg, baseToDoc, confirmateDoctor, saveClasification, saveResponse};