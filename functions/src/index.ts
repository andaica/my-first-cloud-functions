import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();
import axios from 'axios';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info('Hello logs!', { structuredData: true });
    response.send('Hello from Firebase!');
});

export const addMessage = functions.https.onRequest(async (req, res) => {
    const original = req.query.text;
    const writeResult = await admin.firestore().collection('messages').add({ original });
    res.json({ result: `Message with ID: ${writeResult.id} added.` });
});

export const makeUppercase = functions.firestore
    .document('/messages/{documentId}')
    .onCreate((snap, context) => {
        // Grab the current value of what was written to Firestore.
        const original = snap.data().original;

        // Access the parameter `{documentId}` with `context.params`
        functions.logger.log('Uppercasing', context.params.documentId, original);

        const uppercase = original.toUpperCase();

        // You must return a Promise when performing asynchronous tasks inside a Functions such as
        // writing to Firestore.
        // Setting an 'uppercase' field in Firestore document returns a Promise.
        return snap.ref.set({ uppercase }, { merge: true });
    });

let notiInterval: any = null;
let notiCount = 0;
export const startNoti = functions.https.onRequest(async (req, res) => {
    if (notiInterval) clearInterval(notiInterval);
    notiCount = 1;
    sendPushNoti(notiCount);

    notiInterval = setInterval(() => {
        notiCount++;
        sendPushNoti(notiCount);
        if (notiCount >= 10) clearInterval(notiInterval);
    }, 10000);

    res.json({ result: 'Start notify success! You will receive soon.' });
});

const sendPushNoti = (index: number) => {
    axios
        .post(
            'https://fcm.googleapis.com/fcm/send',
            {
                data: {
                    title: 'Test push ' + index,
                    body: 'Test push notification ' + index,
                },
                to: '/topics/andaica',
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization:
                        'key=AAAAS-dKI_k:APA91bGKBR4NQSlqehLnLp2WzDkmpk4WkbbYSEavxcPltmVRsuZ-8MlVnc13B4dQlc2H8cBiE0gs_Rh2MJog7O9QVmZFtVQPUAzFW5_vGomgCk-tSbOOz_bGP8EyQUJ2gHp0fvcoByC6',
                },
            },
        )
        .then((res) => {
            console.log('send push noti: ', index, res.data);
        })
        .catch((error) => {
            console.error(error);
        });
};
