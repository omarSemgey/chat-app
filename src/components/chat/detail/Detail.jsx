import './Detail.css'
import { useUserStore } from '../../../lib/UserStore';
import { useChatStore } from '../../../lib/ChatStore';
import {  db } from '../../../lib/firebase'
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function Detail({createdAt,customRef}){
    const { currentUser, fetchUserInfo } = useUserStore();
    const { user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore();
    const [date,setDate] = useState('');

    async function handleBlock(){

        if(!user) return;

        try{

            const userDocRef = doc(db, 'users', currentUser.id);

            await updateDoc(userDocRef,{
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id)
            });

            changeBlock();

            fetchUserInfo(currentUser.id);

        }catch(err){

        }
    }

    useEffect(() => {
        let date = createdAt.toDate();
        let mm = date.getMonth();
        let dd = date.getDate();
        let yyyy = date.getFullYear();
        setDate(mm + '/' + dd + '/' + yyyy);
    },[])

    return(
        <>
        <div className='detail' ref={customRef}>
            <div className='user'>
                <img 
                src=
                {
                    isCurrentUserBlocked
                    ||
                    isReceiverBlocked
                    ? './avatar.png' 
                    : user.avatar || './avatar.png'
                    } 
                />
                <h2>
                {
                isCurrentUserBlocked 
                ? 'User' 
                : isReceiverBlocked 
                ? 'Blocked user' 
                : user.username
                }
                </h2>
                <span>Been chatting since: {date}</span>
            </div>
            <div className="info">
                <button 
                disabled={isCurrentUserBlocked}
                onClick={handleBlock}>
                {
                    isCurrentUserBlocked ? 'You are blocked!' : isReceiverBlocked ? 'User blocked' : 'Block user'
                }
                </button>
            </div>
        </div>
        </>
    )
}