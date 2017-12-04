const express = require('express');
const PORT = process.env.PORT || 5000;

const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

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

uploadRecording = (req, res) => {
    const fileName = req.file.path;
    const file = fs.readFileSync(fileName);
    const audioBytes = file.toString('base64');

    const languageCode = req.body.lang;

    const audio = { content: audioBytes };
    const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode
    };
    const request = {
        audio, config
    };

    speechClient
        .recognize(request)
        .then(data => {
            const response = data[0];
            const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');

            fs.unlink(req.file.path);
            res.send({ transcription });
        })
        .catch(err => {
            fs.unlink(req.file.path);
            res.send(err);
        });
};

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.get('/languages', onLanguagesRequest.bind())
    .get('/translate', onTranslateRequest.bind())
    .post('/upload', upload.single('recording'), uploadRecording.bind())
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));
