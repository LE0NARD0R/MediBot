const AWS = require('aws-sdk')
const fs = require('fs');

AWS.config.loadFromPath('./config.json')

const textToSpeech = async (voiceId, text) => {
    const polly = new AWS.Polly({
      region: 'us-west-2'
    });
  
    const input = {
      Engine: 'standard',
      LanguageCode: 'es-US',
      OutputFormat: 'mp3',
      Text: text,
      TextType: 'text',
      VoiceId: voiceId,
    };
  
    const pathFile = `${process.cwd()}/tmp/${Date.now()}-audio.mp3`;
  
    return new Promise((resolve, reject) => {
      polly.synthesizeSpeech(input, (err, data) => {
        if (err) {
          console.error('Error al generar el audio:', err);
          reject(err);
        } else {
          fs.writeFile(pathFile, data.AudioStream, (err) => {
            if (err) {
              console.error('Error al escribir el archivo de audio:', err);
              reject(err);
            } else {
              resolve(pathFile);
            }
          });
        }
      });
    });
  };

module.exports = {textToSpeech}