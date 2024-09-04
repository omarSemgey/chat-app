import './Login.css'
import { useState } from 'react'
import {toast} from 'react-toastify'
import { auth, db } from '../../lib/firebase'
import { upload } from '../../lib/upload'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { collection, query, doc, getDocs, setDoc, where } from 'firebase/firestore'

export default function Login(){
    const [avatar,setAvatar] = useState({
        file:null,
        url:''
    });
    const [loading,setLoading] = useState(false);

    function handleAvatar(e){
        if(e.target.files[0]){
            const validExtensions = ["image/jpeg", "image/jpg", "image/png"];
            if(validExtensions.includes(e.target.files[0].type)){
                setAvatar({
                    file: e.target.files[0],
                    url: URL.createObjectURL(e.target.files[0])
                })
            }
        }
    }

    async function handleLogin(e){
        e.preventDefault();

        const formData = new FormData(e.target);
        const {email, password} = Object.fromEntries(formData);

        //check for inputs

        if (!email || !password) return toast.warn("Please enter all inputs!");

        setLoading(true);

        try{

        await signInWithEmailAndPassword(auth,email,password);

        toast.success('User logged in successfully')

        }catch(err){
            toast.error(err.message)
        }finally{
            setLoading(false);
        }


    }

    async function handleRegister(e){
        e.preventDefault();

        const formData = new FormData(e.target);

        const {username,email,password} = Object.fromEntries(formData);

        //check for inputs

        if (!username || !email || !password) return toast.warn("Please enter all inputs!");

        if(username.length < 3)  return toast.warn("Username must be at least be 3 characters!");

        if(!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) return toast.warn("Please a valid email!");

        if(password.length < 8)  return toast.warn("Please enter a valid password!");

        //check for avatar

        // if (!avatar.file) return toast.warn("Please upload an avatar!");

        //check for unique name

        const usersRef = collection(db, "users");

        const q = query(usersRef, where("username", "==", username));

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) return toast.warn("Username already taken");

        setLoading(true);

        try{

            const res = await createUserWithEmailAndPassword(auth,email,password)

            const imgUrl = avatar.file ? await upload(avatar.file) : '';

            await setDoc(doc(db, 'users', res.user.uid),{
            username,
            email,
            avatar: imgUrl,
            id: res.user.uid,
            blocked:[]
        });

            await setDoc(doc(db, 'userchats', res.user.uid),{
            chats:[]
        });

        await signInWithEmailAndPassword(auth,email,password);

        toast.success('User created successfully');

        }catch(err){
            toast.error(err.message)
        }finally{
            setLoading(false)
        }

    }

    return(
        <>
        <div className='login'>
            <div className="item">
                <h2>Welcome back!</h2>
                <form
                onSubmit={handleLogin}
                >
                    <input  disabled={loading} type="text" placeholder='Email' name='email'/>
                    <input  disabled={loading} type="password" placeholder='Password' name='password'/>
                    <button disabled={loading}>{loading ? 'Loading...' : 'Sing In'}</button>
                </form>
            </div>
            <div className="separator"></div>
            <div className="item">
                <h2>Create an Account</h2>
                <form 
                onSubmit={handleRegister}
                > 
                    <label className={loading ? 'disabled' : ''} htmlFor="file">
                        <img src={avatar.url || './avatar.png'} alt="" />
                        Upload an image
                    </label>
                    <input  disabled={loading} type="file" id='file' hidden
                    onChange={handleAvatar}
                    accept="image/jpeg, image/png, image/jpg"
                    />
                    <input  disabled={loading} type="text" placeholder='Username' name='username'/>
                    <input  disabled={loading} type="text" placeholder='Email' name='email'/>
                    <input  disabled={loading} type="password" placeholder='Password' name='password'/>
                    <button disabled={loading}>{loading ? 'Loading...' : 'Sign Up'}</button>
                </form>
            </div>
        </div>
        </>
    )
}