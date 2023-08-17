const { Configuration, OpenAIApi } = require("openai");

const responseIA = async (asking) => {

    const message = [{
        role: 'doctor', content : 'Te voy a dar unos síntomas, sin reemplazar el diagnóstico médico dame recomendaciones y qué enfermedad puedo estar presentando, los síntomas son los siguientes: ${asking} .'
    }]

    try {
        const configuration = new Configuration({
          apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const resp = await openai.ChatCompletion.create(
            model = "gpt-3.5-turbo", 
            messages = message, 
            temperature = o, 
            max_tokens = 150,
        );
      
        return resp.data.choices[0].message.content;
      } catch (err) {
        console.log('en algo la cagaste')
        return "ERROR";
      };

}

module.exports = {responseIA};