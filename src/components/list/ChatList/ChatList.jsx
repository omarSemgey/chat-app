import './ChatList.css'
import { useEffect, useRef, useState } from 'react'
import AddUser from './AddUser/AddUser';
import { useUserStore } from '../../../lib/UserStore'
import { useChatStore } from '../../../lib/ChatStore';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
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

            const items = res.data().chats;

            const promises = items.map(async item =>{

                const userDocRef = doc(db, 'users', item.receiverId);

                const userDocSnap = await getDoc(userDocRef);

                const user = userDocSnap.data();

                return { ...item, user }

            });

            const chatData = await Promise.all(promises);

            setChats(chatData.sort((a,b) => b.updatedAt - a.updatedAt))

        })

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

            changeChat(chat.chatId,chat.user);
        }catch(err){

        }


    }

    const filteredChats = chats.filter(
        c => 
        c.user.username.toLowerCase().includes(search.toLocaleLowerCase())
    )

    return(
        <>
        <div className='chat-list'>
            <div className='search'>
                <div className='search-bar'>
                    <img src="./search.png" alt="" />
                    <input type="text" placeholder='Search'
                    onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <img className='add' 
                src={addMode ? './minus.png' : './plus.png'}
                onClick={() => setAddMode(prev => !prev)}
                />
            </div>
            {
                filteredChats.map(chat => (
                    <div className='item' key={chat.chatId} 
                    onClick={() => handleSelect(chat)}
                    style={{
                        backgroundColor:
                        chat?.chatId !== chatId 
                        ?
                        (
                        chat?.isSeen 
                        ?
                        'transparent'
                        : '#5183fe'
                        )
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
                ))
            }
            {addMode &&  <AddUser customRef={addModeRef} addMode={setAddMode}/>}
        </div>
        </>
    )
}