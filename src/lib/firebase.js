import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
// import { getDoc, updateDoc, doc } from "firebase/firestore"
import { getStorage } from 'firebase/storage'
import 'firebase/messaging'
// import { getMessaging, getToken, onMessage } from "firebase/messaging";
// import { useUserStore } from "./UserStore";




const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID,
};

// const app = initializeApp(firebaseConfig);
initializeApp(firebaseConfig);

// const messaging = getMessaging();

// export const requestForToken = async (token,userId) => {
//     const permission = await Notification.requestPermission();
//     if(!token && permission == 'granted'){
//         return getToken(messaging, { vapidKey: `BBiro0kGdldAsUTux-EIgDD-adI1_6arwj8C3CtorcTcR17P1i5pgJGU5XnYDAWDwpsOwBdH8TgAQLRCsEsyW-k` })
//         .then( async (currentToken) => {
//             if (currentToken) {
//                 try{
//                     const userDocRef = doc(db, 'users', userId);

//                         await updateDoc(userDocRef,{
//                             token: currentToken,
//                         });

//                 }catch(err){
//                     console.log(err)
//                 }
//             }
//         }).catch((err) => {
//             console.log(err);
//         });
//     }

// };

// export const onMessageListener = () =>
//     new Promise((resolve) => {    
//     onMessage(messaging, (payload) => {
//         resolve(payload);
//     });
// });


export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();