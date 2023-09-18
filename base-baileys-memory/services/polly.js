const AWS = require('aws-sdk')
const fs = require('fs');

AWS.config.loadFromPath('./config.json')



const textToSpeech =(voiceId, text) => {
    
    const polly = new AWS.Polly({
        region: 'us-west-2'
    })
    const input = {
        Engine: 'standard',
        LanguageCode: 'es-US',
        OutputFormat:'mp3',
        Text: text,
        TextType: 'text',
        VoiceId: voiceId,
    }
    const pathFile = `${process.cwd()}/tmp/${Date.now()}-audio.mp3`;
    
    polly.synthesizeSpeech(input, (err, data) => {
        fs.writeFileSync(pathFile, data.AudioStream, (err) =>{})
    })

    return pathFile
}

module.exports = {textToSpeech}