import './AddUser.css'
import { useState } from 'react';
import { db } from '../.././../../lib/firebase'
import { useUserStore } from '../.././../../lib/UserStore'
import { arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function AddUser({addMode,customRef}){
    const [user,SetUser] = useState(null)
    const { currentUser } = useUserStore()

    async function handleSearch(e){
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');

        try{

            const userRef = collection(db, 'users');

            const q = query(userRef, where('username', '==', username));

            const querySnapShot = await getDocs(q);

            if(!querySnapShot.empty){

                SetUser(...[querySnapShot.docs[0].data()]);

            }else{

                SetUser(null)

            }


        }catch(err){
        }
    }

    async function handleAdd(){

        const chatRef = collection(db, 'chats')
        const userChatsRef = collection(db, 'userchats')

        try{

            const newChatRef = doc(chatRef);

            await setDoc(newChatRef,{
                createdAt: serverTimestamp(),
                messages: [],
            });

            //add chat to the wanted guy

            await updateDoc(doc(userChatsRef, user.id),{
                chats: arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: '',
                    receiverId: currentUser.id,
                    updatedAt: Date.now(),
                })
            })

            //add chat to you

            await updateDoc(doc(userChatsRef, currentUser.id),{
                chats: arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: '',
                    receiverId: user.id,
                    updatedAt: Date.now(),
                })
            })

            addMode(false);
            toast.success('chat added successfully')

        }catch(err){
        }
    }

    return(
        <>
        <div className='add-user' ref={customRef}>
            <form
            onSubmit={handleSearch}
            >
                <input type="search" placeholder='Username' name='username'/>
                <button>Search</button>
            </form>
            {user !== null &&
                <div className="user">
                    <div className="details">
                        <img src={user.avatar || './avatar.png'} alt="" />
                        <span>{user.username}</span>
                    </div>
                    <button onClick={handleAdd}>Add User</button>
                </div>
                // : <span>No user was found</span>
            }
        </div>
        </>
    )
}