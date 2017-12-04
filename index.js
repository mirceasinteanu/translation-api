const express = require('express');
const PORT = process.env.PORT || 5000;

const speech = require('@google-cloud/speech');
const Translate = require('@google-cloud/translate');

const bodyParser = require('body-parser');

const speechClient = new speech.SpeechClient({ keyFilename: './config/service_account.json' });
const translationClient = new Translate({ keyFilename: './config/service_account.json' });

const app = express();

onLanguagesRequest = (req, res) => {
    const target = req.query.target || 'en';

    translationClient
        .getLanguages(target)
        .then(results => {
            const languages = results[0];

            res.send(languages);
        })
        .catch(err => {
            res.send({ error: err });
        });
};

onTranslateRequest = (req, res) => {
    const { text, target } = req.query;

    translationClient
        .translate(text, target)
        .then(results => {
            const translation = results[0];

            res.send(translation);
        })
        .catch(err => {
            res.send({ error: err });
        });
};

upload = (req, res) => {
    const audioData = req.body.data;
    const languageCode = req.body.lang;

    const audio = { content: audioData };
    const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode
    };
    const request = {
        audio, config
    };

    console.log(request);

    speechClient
        .recognize(request)
        .then(data => {
            const response = data[0];
            const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');

            res.send(200, transcription);
        })
        .catch(err => {
            res.send(500, err);
        });
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/languages', onLanguagesRequest.bind())
    .get('/translate', onTranslateRequest.bind())
    .post('/upload', upload.bind())
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));
