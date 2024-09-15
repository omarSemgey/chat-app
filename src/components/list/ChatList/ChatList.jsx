import './ChatList.css'
import { useEffect, useRef, useState } from 'react'
import AddUser from './AddUser/AddUser';
import { useUserStore } from '../../../lib/UserStore'
import { useChatStore } from '../../../lib/ChatStore';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function ChatList({section}){
    const [chats,setChats] = useState([]);
    const [addMode,setAddMode] = useState(false);
    const [search,setSearch] = useState('');

    const { currentUser } = useUserStore();    
    const { changeChat, chatId } = useChatStore();  

    const addModeRef = useRef();

    useEffect(()=>{

        const unSub = onSnapshot(
            doc(db, 'userchats', currentUser.id),
            async res =>{

            const items = res.data()?.chats;

            const promises = items.map(async item =>{

                if(item.type == 'chat'){

                    const userDocRef = doc(db, 'users', item.receiverId);

                    const userDocSnap = await getDoc(userDocRef);

                    const user = userDocSnap.data();

                    return { ...item, user }

                }else{
                    return {...item}
                }

            });

            const chatData = await Promise.all(promises);

            setChats(chatData.sort((a,b) => b.updatedAt - a.updatedAt))

            }
        )  


        return ()=>{
            unSub()
        }

    },[currentUser.id])

    useEffect(()=>{
        document.addEventListener('mousedown',checkClickOutside)
    })

    function checkClickOutside(e){

        if(addMode && !addModeRef.current?.contains(e.target)) setAddMode(false)

    }

    async function handleSelect(chat){
        
        if(document.querySelector('.hidden')) document.querySelector('.hidden').classList.remove('hidden');
        section.current.classList.add('hidden');

        const userChats = chats.map(item => {
            const {user, ...rest} = item;
            return rest;
        })

        const ChatIndex = userChats.findIndex(c => c.chatId === chat.chatId)

        userChats[ChatIndex].isSeen = true;

        const userChatsRef = doc(db, 'userchats', currentUser.id);

        
        try{

            await updateDoc(userChatsRef,{
                chats: userChats
            });

            if(chat.type == 'group'){
                changeChat(chat.chatId,chat.type, null, chat.groupName, chat.groupImg);

            }else{

                changeChat(chat.chatId,chat.type, chat.user);

            }

        }catch(err){

        }


    }

    const filteredChats = chats.filter(
        c => {
        if(c.type == 'chat'){
            if(!c.user.username.toLowerCase().includes(search.toLocaleLowerCase())){
                return false;
            }
            return true;
        }else{
            if(!c.groupName.toLowerCase().includes(search.toLocaleLowerCase())){
                return false;
            }
            return true;
        }
        }
    );

    return(
        <>
        <div className='chat-list'>
            <div className='search'>
                <div className='search-bar'>
                    <img src="./search.png" alt="" />
                    <input type="text" autoFocus placeholder='Search'
                    onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <img className='add' 
                src={addMode ? './minus.png' : './plus.png'}
                onClick={() => setAddMode(prev => !prev)}
                />
            </div>
            {
                filteredChats?.length !== 0
                ?
                filteredChats?.map(chat => {
                    if(chat.type == 'group'){
                        return(
                            <div 
                            className=
                            {
                                chat?.chatId !== chatId 
                                ?
                                (
                                chat?.isSeen 
                                ?
                                'item'
                                : 'item unseen'
                                )
                                :
                                'item'
                            } 
                            key={chat.chatId} 
                            onClick={() => handleSelect(chat)}
                            style={{
                                backgroundColor:
                                chat?.chatId !== chatId 
                                ?
                                'transparent'
                                :
                                'rgba(17, 25, 40, 0.5)'
                            }}
                            >
                                <img src={ chat.groupImg || './avatar.png' } alt="" />
                                <div className='texts'>
                                    <span>
                                        {chat.groupName}
                                    </span>
                                    <p>{chat.lastMessage}</p>
                                </div>
                            </div>
                        )
                    }else{
                        return(
                            <div 
                            className=
                            {
                                chat?.chatId !== chatId 
                                ?
                                (
                                chat?.isSeen 
                                ?
                                'item'
                                : 'item unseen'
                                )
                                :
                                'item'
                            } 
                            key={chat.chatId} 
                            onClick={() => handleSelect(chat)}
                            style={{
                                backgroundColor:
                                chat?.chatId !== chatId 
                                ?
                                'transparent'
                                :
                                'rgba(17, 25, 40, 0.5)'
                            }}
                            >
                                <img src={
                                chat.user.blocked.includes(currentUser.id) 
                                ||
                                currentUser.blocked.includes(chat.user.id)
                                ? './avatar.png' 
                                : chat.user.avatar || './avatar.png'
                                } alt="" />
                                <div className='texts'>
                                    <span>
                                    {chat.user.blocked.includes(currentUser.id) 
                                    ? 'User' 
                                    : currentUser.blocked.includes(chat.user.id)
                                    ?
                                    'Blocked user'
                                    :
                                    chat.user.username
                                    }
                                    </span>
                                    <p>{chat.lastMessage}</p>
                                </div>
                            </div>
                        )
                    }
                })
                :
                <h2 className='text-center'>No chats were found.</h2>
            }
            {addMode &&  <AddUser customRef={addModeRef} addMode={setAddMode}/>}
        </div>
        </>
    )
}