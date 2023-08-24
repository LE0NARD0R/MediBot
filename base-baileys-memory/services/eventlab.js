const fs = require('node:fs')
/**
 *
 * @param {*} voiceId clone voice vwfl76D5KBjKuSGfTbLB
 * @returns
 */

voiceid =['21m00Tcm4TlvDq8ikWAM', 'XB0fDUnXU5powFXDhCwa', '2EiwWnXFnvU5JabPnv8n', 'AZnzlk1XvdvUeBnXmlld', 'CYw3kZ02Hs0563khs1Fj', 'D38z5RcWu1voky8WS1ja']
voiceId = getRandomItem(voiceid);

const textToVoice = async (text,voiceId = 'XB0fDUnXU5powFXDhCwa') => {
  const EVENT_TOKEN = process.env.EVENT_TOKEN ?? "";
  const URL = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const header = {
    "accept": "audio/mpeg",
    "xi-api-key": EVENT_TOKEN,
    "Content-Type": "application/json"
  }
 

  const raw = JSON.stringify({
    text,
    model_id: "eleven_multilingual_v1",
    voice_settings: {
      stability: 1,
      similarity_boost: 0.8,
    },
  });

  const requestOptions = {
    method: "POST",
    headers: header,
    body: raw,
    redirect: "follow",
  };

  const response = await fetch(URL, requestOptions);
  const buffer = await response.arrayBuffer();
  const pathFile = `${process.cwd()}/tmp/${Date.now()}-auido.mp3`;
  fs.writeFileSync(pathFile, Buffer.from(buffer));
  
  return pathFile;
};

function getRandomItem(arr) {

  // get random index value
  const randomIndex = Math.floor(Math.random() * arr.length);

  // get random item
  const item = arr[randomIndex];

  return item;
}

module.exports = { textToVoice };
