import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from './firebase'

export async function upload(file){

    const date = new Date();

    const storageRef = ref(storage, `images/${date + file.name}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            }, 
            (error) => {
                reject('Something went wrong' +error.code)
            }, 
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                resolve(downloadURL);
            });
            }
        );

    })


}
