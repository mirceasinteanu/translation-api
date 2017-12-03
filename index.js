const express = require('express');
const fileUpload = require('express-fileupload');
const PORT = process.env.PORT || 5000;

const speech = require('@google-cloud/speech');
const Translate = require('@google-cloud/translate');

const fs = require('fs');

const speechClient = new speech.SpeechClient({ keyFilename: './config/service_account.json' });
const translationClient = new Translate({ keyFilename: './config/service_account.json' });

const app = express();

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

    speechClient
        .recognize(request)
        .then(data => {
            const response = data[0];
            const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');

            res.send(`Transcription: ${transcription}`);
        })
        .catch(err => {
            res.send('ERROR:', err);
        });
};

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
    if (!req.files)
        return res.status(400).send('No files were uploaded.');

    const audioData = req.query.data;
    const audio = { content: audioData };
    const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en'
    };

    const request = {
        audio, config
    };

    speechClient
        .recognize(request)
        .then(data => {
            const response = data[0];
            const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');

            res.send(`Transcription: ${transcription}`);
        })
        .catch(err => {
            res.send('ERROR:', err);
        });

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    // let sampleFile = req.files.sampleFile;

    // sampleFile.mv('/recordings/recording.aac', function(err) {
    //     if (err)
    //         return res.status(500).send(err);
    //
    //     res.send('File uploaded!');
    // });
};

app.use(fileUpload());

app.get('/languages', onLanguagesRequest.bind())
    .get('/speech', onSpeechRequest.bind())
    .get('/translate', onTranslateRequest.bind())
    .post('/upload', upload.bind())
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));
