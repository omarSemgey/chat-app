import './UserSettings.css'
import { auth, db } from '../../../../lib/firebase'
import { useChatStore } from '../../../../lib/ChatStore';
import { useUserStore } from '../../../../lib/userStore';
import { toast } from 'react-toastify';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useState } from 'react';
import { upload } from '../../../../lib/upload';

export default function UserSettings({userSettingsMode,customRef}){
    const { fetchUserInfo, currentUser } = useUserStore();
    const { resetChat } = useChatStore();
    const [loading,setLoading] = useState(false);
    const [avatar,setAvatar] = useState({
        file:null,
        url:''
    });

    function handleLogout(){
        auth.signOut();
        resetChat()
    }

    async function handleSubmit(e){
        e.preventDefault();
        setLoading(true)

        const formData = new FormData(e.target);

        // check for valid inputs

        let username = formData.get('username');
        let email = formData.get('email');
        let password = formData.get('password');


        if(username.length < 3) username = currentUser.username;

        if(!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) email = currentUser.email;

        if(password.length < 8) password = '';

        //check for unique username and email

        if(username !== currentUser.username || email !== currentUser.email){

            const usersRef = collection(db, "users");

            if(username !== currentUser.username ){

                const q = query(usersRef, where("username", "==", username));

                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) return toast.warn("Username already taken");

            }

            if(email !== currentUser.email){

                const q = query(usersRef, where("email", "==", email));

                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) return toast.warn("email already taken");
            }

        }

        try{

            const imgUrl = currentUser.avatar !== avatar.url ? await upload(avatar.file) : '';

            //update username

            const userDocRef = doc(db, 'users', currentUser.id);

            await updateDoc(userDocRef,{
                ...(username !== currentUser.username && {username: username}),
                ...(email !== currentUser.email && {email: email}),
                ...(password.length !== 0 && {password: password}),
                ...(imgUrl.length !== 0 && {avatar: imgUrl}),
            });

            await fetchUserInfo(currentUser.id);

            setLoading(false)

            userSettingsMode(false)

        }catch(err){

        }
    }

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

    return(
        <>
        <div className='user-settings' ref={customRef}>
            <h2>User Settings:</h2>
            <form action="" 
            disabled={loading}
            onSubmit={handleSubmit}
            >
                <label className={loading ? 'disabled' : ''} htmlFor="file">
                    <img src={avatar.url || currentUser.avatar || './avatar.png'} alt="" />
                </label>
                <input disabled={loading} type="file" id='file' hidden
                onChange={handleAvatar}
                accept="image/jpeg, image/png, image/jpg"
                />
                <input disabled={loading} type="text" placeholder='Username' defaultValue={currentUser.username} name='username'/>
                <input disabled={loading} type="email" placeholder='Username' defaultValue={currentUser.email} name='email'/>
                <input disabled={loading} type="password" placeholder='Password' name='password'/>
                <button disabled={loading}>
                    {loading ? 'Editing...' : 'Edit Profile'}
                </button>
            </form>
            <button className='logout' 
                disabled={loading}
                onClick={handleLogout}
                >
                Log out
            </button>
        </div>
        </>
    )
}