import './Detail.css'
import { useUserStore } from '../../../lib/UserStore';
import { useChatStore } from '../../../lib/ChatStore';
import {  db } from '../../../lib/firebase'
import { arrayRemove, arrayUnion, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function Detail({createdAt,customRef,section,groupMembers}){

    const { currentUser, fetchUserInfo } = useUserStore();
    const { chatId, user, groupImg, resetChat, groupName, isCurrentUserBlocked, chatType, isReceiverBlocked, changeBlock } = useChatStore();

    const [date,setDate] = useState('');
    const [showUsers,setShowUsers] = useState(false);
    const [usersLoading,setUsersLoading] = useState(false)
    const [addLoading,setAddLoading] = useState(false)
    const [groupUsers,setGroupUsers] = useState([]);
    const [input,setInput] = useState('');

    async function handleBlock(){

        if(!user || chatType !== 'group') return;

        try{

            const userDocRef = doc(db, 'users', currentUser.id);

            await updateDoc(userDocRef,{
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id)
            });

            changeBlock();

            fetchUserInfo(currentUser.id);

            toast.success('user Blocked')

        }catch(err){

        }
    }

    async function handleChatDelete(){

        if(document.querySelector('.hidden')) document.querySelector('.hidden').classList.remove('hidden');
        section.current.classList.add('hidden');

        resetChat();

        const usersChatsRef = collection(db, 'userchats')

        const chatsRef = collection(db, 'chats')

        try{

            //update chat group members

            if(chatType == 'group'){

                await updateDoc(doc(chatsRef, chatId),{
                    groupMembers: arrayRemove(currentUser.id)
                })

            }


            const userChatsDoc = doc(usersChatsRef, currentUser.id);

            const userChats = (await getDoc(userChatsDoc)).data().chats;

            const chats = userChats.filter(
                c => c['chatId'] !== chatId
            )

            //remove chat from user chats

            await updateDoc(doc(usersChatsRef, currentUser.id),{
                chats,
            })

            toast.success( chatType == 'chat' ? 'Chat removed' :  'Group removed')

        }catch(err){
            console.log(err)
            toast.error(err.message)
        }
    }

    async function handleShowUsers(){

        if(addLoading || usersLoading) return;

        if( !showUsers ){
            setShowUsers(true);
        }else{
            setShowUsers(false);
        }


        if(groupUsers.length == 0){

            setUsersLoading(true)

            await groupMembers.forEach(async id=> {
                if(currentUser.id !== id){

                    const userRef = doc(db, 'users', id);

                    const userSnapshot = await getDoc(userRef);

                    if(userSnapshot.exists()){

                        const userData = userSnapshot.data();

                        console.log(userData)

                        setGroupUsers(prev => [ ...prev ,userData]);

                    }

                }else{
                    console.log(currentUser)
                    setGroupUsers(prev => [ ...prev ,currentUser]);
                }
            });

            setUsersLoading(false)
        }

    }

    async function handleAddChat(member){

        if(addLoading || usersLoading || currentUser.id == member) return;

        setAddLoading(true)

        const docRef = doc(db, 'userchats', currentUser.id);

        const docSnap = await getDoc(docRef);

        const exists = docSnap.data().chats.filter(chat => 
            chat.receiverId == member
        )

        if(exists.length !== 0){
            setAddLoading(false)
            return;
        } 

        const chatRef = collection(db, 'chats')
        const usersChatsRef = collection(db, 'userchats')

        try{

            const newChatRef = doc(chatRef);

            const receiverChats = doc(usersChatsRef, member);

            const receiverChatsSnapshot = await getDoc(receiverChats);

            const receiverChatsData = receiverChatsSnapshot.data().chats;

            let existingChat = [];

            for (let i = 0; i < receiverChatsData.length; i++) {

                if (receiverChatsData[i].receiverId == currentUser.id) {
                    existingChat[0] = true;
                    existingChat[1] = receiverChatsData[i].chatId;
                    break;
                }

            }

            if(!existingChat[0]){

                await setDoc(newChatRef,{
                    createdAt: serverTimestamp(),
                    type: 'chat',
                    messages: [],
                });

                //add chat to the wanted guy

                await updateDoc(doc(usersChatsRef, member),{
                    chats: arrayUnion({
                        chatId: newChatRef.id,
                        lastMessage: '',
                        type: 'chat',
                        receiverId: currentUser.id,
                        updatedAt: Date.now(),
                    })
                })

            }

            //add chat to you

            await updateDoc(doc(usersChatsRef, currentUser.id),{
                chats: arrayUnion({
                    chatId: !existingChat[0] ? newChatRef.id : existingChat[1],
                    lastMessage: '',
                    type: 'chat',
                    receiverId: member,
                    updatedAt: Date.now(),
                })
            })

            toast.success('chat added successfully')

        }catch(err){
            console.log(err)
            toast.error(err.message)
        }
        finally{
            setAddLoading(false)
        }
    }

    const filteredUsers = groupUsers?.filter(
        user => user.username.toLowerCase().includes(input.toLocaleLowerCase())
    )
    useEffect(() => {
        //setting up ti,e
        let date = createdAt.toDate();
        let mm = date.getMonth();
        let dd = date.getDate();
        let yyyy = date.getFullYear();
        setDate(mm + '/' + dd + '/' + yyyy);

        let unSub;

        if(chatType == 'group'){

            unSub = async () => {
                let users = [];
                for(let i =0; i < groupMembers.length; i++){
                    const usersRef = doc(db, 'users', groupMembers[i]);

                    const usersSnapshot = await getDoc(usersRef);

                    if(usersSnapshot.exists()){
                        users.push(usersSnapshot.data())
                    }
                }
            }

        }

        return () => {
            chatType == 'group' && unSub()
        }
    },[])

    return(
        <>
        <div className='detail' ref={customRef}>
            <div className='user'>
                <img 
                src=
                {
                chatType == 'group'
                ?
                groupImg || './avatar.png'
                :
                isCurrentUserBlocked
                ||
                isReceiverBlocked
                ? './avatar.png' 
                : user.avatar || './avatar.png'
                } 
                />
                <h2>
                {
                chatType == 'group'
                ?
                groupName
                :
                isCurrentUserBlocked 
                ? 'User' 
                : isReceiverBlocked 
                ? 'Blocked user' 
                : user.username
                }
                </h2>
                <span>Been chatting since: {date}</span>
            </div>
            {
            chatType == 'group' && 
            <div className='group-users'>
                <div className='title'
                onClick={handleShowUsers}
                >
                    <span>Group Members</span>
                    <img src="./arrowDown.png" alt="" 
                    className={showUsers ? 'active' : ''}
                    />
                </div>
                {
                    showUsers &&
                    <div className='users'>

                        {
                            !usersLoading &&
                            <div className='search'>
                                <div className='search-bar'>
                                    <img src="./search.png" alt="" />
                                    <input type="text" placeholder='Search'
                                    onChange={e => setInput(e.target.value)}
                                    />
                                </div>
                            </div>
                        }

                        {
                            usersLoading
                            ?
                            <span>Loading..</span>
                            :
                            filteredUsers?.length !== 0
                            ?
                            filteredUsers.map(member => 
                                <div key={member.id}
                                onClick={() => handleAddChat(member.id)}
                                className={addLoading ? ' group-user disabled' : 'group-user'}
                                >
                                    <img src={member.avatar || './avatar.png'} alt="" />
                                    <span>{member.username}</span>
                                </div>
                            )
                            :
                            <span className='text-center'>No users were found.</span>
                        }

                    </div>
                }
            </div>
            }
            <div className="info">
                {
                    chatType == 'group'
                    ?
                    <button onClick={handleChatDelete}
                    disabled={addLoading || usersLoading}
                    >Leave group</button>
                    :
                    <>
                    <button 
                    disabled={isCurrentUserBlocked}
                    onClick={handleBlock}>
                    {
                        isCurrentUserBlocked ? 'You are blocked!' : isReceiverBlocked ? 'User blocked' : 'Block user'
                    }
                    </button>
                    <button onClick={handleChatDelete}>Delete Chat</button>
                    </>
                }
                {/* <button
                    disabled={isCurrentUserBlocked || addLoading || usersLoading}
                >Block notification</button> */}
            </div>
        </div>
        </>
    )
}