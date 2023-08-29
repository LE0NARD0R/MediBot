const { downloadMediaMessage } = require('@adiwajshing/baileys');
const fs = require('node:fs/promises');
const { convertOggMp3 } = require('./services/convert');
const { voiceToText } = require('./services/whisper');

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
  return text;
  /**
   * OMITIR
   */
};

const handlerImg = async (ctx) => {
  const buffer = await downloadMediaMessage(ctx, 'buffer')
  const pathTmpJpeg = `${process.cwd()}/tmp/img-${Date.now()}.jpeg`
  await fs.writeFile(pathTmpJpeg, buffer)
  return pathTmpJpeg
}

module.exports = { handlerAI, handlerImg };
