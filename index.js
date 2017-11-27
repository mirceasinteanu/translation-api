const express = require('express');
const PORT = process.env.PORT || 5000;

const speech = require('@google-cloud/speech');
const fs = require('fs');

const client = new speech.SpeechClient({
    keyFilename: './config/service_account.json'
});

onSpeechRequest = (req, res) => {
    const fileName = './samples/man2_orig.wav';
    const file = fs.readFileSync(fileName);
    const audioBytes = file.toString('base64');
    const audio = { content: audioBytes };
    const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en'
    };

    const request = {
        audio, config
    };

    client
        .recognize(request)
        .then(data => {
            const response = data[0];
            const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');

            console.log(`Transcription: ${transcription}`);
            console.log(req);

            res.send(`Transcription: ${transcription}`);
        })
        .catch(err => {
            console.error('ERROR:', err);
            res.send('ERROR:', err);
        });
};

express()
    .get('/speech', onSpeechRequest.bind())
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));
