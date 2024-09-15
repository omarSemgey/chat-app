import './Chat.css';
import Detail from './detail/Detail';
import { useEffect, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react'
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc,} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useUserStore } from '../../lib/UserStore';
import { useChatStore } from '../../lib/ChatStore';
import { upload } from '../../lib/upload'
import { format } from "timeago.js";
// import * as admin from 'firebase-admin'

export default function Chat(){
    const [chat,setChat] = useState(false);
    const [loading,setLoading] = useState(false);
    const [emojiMood,setEmojiMode] = useState(false);
    const [searchMode,setSearchMode] = useState(false);
    const [detailMode,setDetailMode] = useState(false);
    const [seen,setSeen] = useState(false);
    const [deletingMessage,setDeletingMessage] = useState(false);
    const [text,setText] = useState('');
    const [input,setInput] = useState('');
    const [img,setImg] = useState({
        file: null,
        url: ''
    })

    const endRef = useRef(null);
    const section = useRef(null);
    const detailMoeRef = useRef(null)
    const searchModeRef = useRef(null)
    const emojiMoodRef = useRef(null)

    const { chatId, chatType, user, isCurrentUserBlocked, isReceiverBlocked, resetChat } = useChatStore();
    const { currentUser } = useUserStore();

    useEffect(()=>{
        document.addEventListener('mousedown',checkClickOutside)
    })

    function checkClickOutside(e){

        if(detailMode && !detailMoeRef.current?.contains(e.target)) setDetailMode(false);

        if(searchMode && !searchModeRef.current?.contains(e.target)) setSearchMode(false);

        if(emojiMood && !emojiMoodRef.current?.contains(e.target)) setEmojiMode(false);

    }

    useEffect(()=>{
        endRef.current.scrollIntoView();
    },[chat])

    useEffect(()=>{

        const unSub = onSnapshot(doc(db, 'chats', chatId),res=>{
            setChat(res.data())
            document.title = chatType == 'group' ? res.data().groupName : user.username;
        })

        let unSub2;

        if(chatType !== 'group'){

            unSub2 = onSnapshot(doc(db, 'userchats', user.id),res=>{
                const currentChatIndex = res.data().chats.findIndex(chat => chat.chatId === chatId);
                const isSeen = res.data().chats[currentChatIndex]?.isSeen;
                setSeen(isSeen)
            })

        }

        return () =>{
            unSub()
            chatType !== 'group' && unSub2()
        }
    }, [user,chatId])


    function handleEmoji(e){
        setText(prev => prev + e.emoji);
    }

    function handleImg(e){
        if(isCurrentUserBlocked || isReceiverBlocked || loading) return;
        if(e.target.files[0]){
            const validExtensions = ["image/jpeg", "image/jpg", "image/png"];
            if(validExtensions.includes(e.target.files[0].type)){
                setImg({
                    file: e.target.files[0],
                    url: URL.createObjectURL(e.target.files[0])
                })
                endRef.current.scrollIntoView();
            }
        }
    }

    async function handleSend(){
        if(text === '' && !img.file  || isCurrentUserBlocked || isReceiverBlocked || loading) return;

        endRef.current.scrollIntoView();

        setLoading(true)

        let imgUrl = null;

        let currentText = text;

        setText('')

        try{

            //sending image

            if(img.file) imgUrl = await upload(img.file)

            await updateDoc(doc(db, 'chats', chatId),{
                messages: arrayUnion({
                    senderId: currentUser.id,
                    text: currentText,
                    createdAt: new Date(),
                    ...(chatType == 'group' && {senderAvatar: currentUser.avatar}),
                    ...(chatType == 'group' && {senderUsername: currentUser.username,}),
                    ...(imgUrl && {img: imgUrl})
                })
            });

            setLoading(false);

            setImg({
                file: null,
                url: ''
            })


            //updating chat in chat list

            if(chatType == 'group'){

            chat.groupMembers.forEach(async id=> {

                const userChatRef = doc(db, 'userchats', id);

                const userChatsSnapshot = await getDoc(userChatRef);

                if(userChatsSnapshot.exists()){

                    const userChatsData = userChatsSnapshot.data();

                    const chatIndex = userChatsData.chats.findIndex(chat => chat.chatId === chatId);

                    userChatsData.chats[chatIndex].lastMessage = chatType == 'group' ? `${currentUser.username}: ${currentText ? currentText : 'Image'}` : currentText ? currentText : 'Image';
                    userChatsData.chats[chatIndex].isSeen = id == currentUser.id;
                    userChatsData.chats[chatIndex].updatedAt = Date.now();

                    await updateDoc(userChatRef,{
                        chats: userChatsData.chats,
                    })

                }

            });

            }else{

            const userIds = [currentUser.id,user.id];

            userIds.forEach(async id=> {

                const userChatRef = doc(db, 'userchats', id);

                const userChatsSnapshot = await getDoc(userChatRef);

                if(userChatsSnapshot.exists()){

                    const userChatsData = userChatsSnapshot.data();

                    const chatIndex = userChatsData.chats.findIndex(chat => chat.chatId === chatId);

                    userChatsData.chats[chatIndex].lastMessage = currentText ? currentText : 'image';
                    userChatsData.chats[chatIndex].isSeen = id == currentUser.id;
                    userChatsData.chats[chatIndex].updatedAt = Date.now();

                    await updateDoc(userChatRef,{
                        chats: userChatsData.chats,
                    })
                }

                // if(currentUser.id !== id){

                //     const userRef = doc(db, 'users', id);

                //     const userSnapshot = await getDoc(userRef);

                //     if(userSnapshot.exists()){

                //         const userData = userSnapshot.data();

                //         admin.initializeApp();

                //         const db = admin.fireStore();

                //         const fcm = admin.messaging();  

                //         const payload = {
                //             notification: {
                //                 title: currentUser.username,
                //                 body: currentText,
                //             }
                //         }

                //         if (userData.token) fcm.sendToDevice(userData.token,payload)

                //     }

                // }
            });
            }

        }catch(err){

        }
    }

    function handleSectionChange(){

        document.title = 'Chat app';
        if(document.querySelector('.hidden')) document.querySelector('.hidden').classList.remove('hidden');
        section.current.classList.add('hidden');

        resetChat();
    }

    async function handleMessageDelete(message){

        if(deletingMessage) return;

        setDeletingMessage(true)

        const messagesAfterDeletion = chat.messages?.filter(
            m => {
                if(
                    m.text == message.text 
                    && m.senderId == message.senderId 
                    && m.createdAt == message.createdAt 
                ){
                    return false;
                }
                return true;
            }
        )

        await updateDoc(doc(db, 'chats', chatId),{
            messages: messagesAfterDeletion,
        });

        setInput('');
        setDeletingMessage(false);

    }

    const filteredMessages = chat.messages?.filter(
        m => m.text.toLowerCase().includes(input.toLocaleLowerCase())
    )

    return(
        <>
        <div className='chat' ref={section}>
            <div className='top'>
                {
                    chatType == 'group'
                    ?
                    (
                        <div className="user">
                            <img src="./arrow.png" alt="" className='arrow'
                            onClick={handleSectionChange}
                            />
                            <img 
                            src= { chat.groupImg || './avatar.png' } 
                            alt="" />
                            <div className='texts'>
                                <span>{ chat.groupName }</span>
                            </div>
                        </div>
                    )
                    :
                    (
                        <div className="user">
                            <img src="./arrow.png" alt="" className='arrow'
                            onClick={handleSectionChange}
                            />
                            <img 
                            src=
                            {
                            isCurrentUserBlocked
                            ||
                            isReceiverBlocked
                            ? './avatar.png' 
                            : user.avatar || './avatar.png'
                            } 
                            alt="" />
                            <div className='texts'>
                                <span>
                                {
                                isCurrentUserBlocked 
                                ? 'User' 
                                : isReceiverBlocked 
                                ? 'Blocked user' 
                                : user.username
                                }
                                </span>
                            </div>
                        </div>
                    )
                }
                <div className="icons">
                    <img src="./search.png" alt="" 
                    onClick={() => setSearchMode(prev => !prev)}
                    />
                    <img src="./info.png" alt="" 
                    onClick={() => setDetailMode(prev => !prev)}
                    />
                </div>
                {searchMode &&
                <div ref={searchModeRef} className='search'>
                    <div className='search-bar'>
                        <img src="./search.png" alt="" />
                        <input type="text" placeholder='Search'
                        onChange={e => setInput(e.target.value)}
                        />
                    </div>
                </div>
                }
            </div>
            <div className='center'>
            {
                chat.messages?.length !== 0
                ?
                filteredMessages?.length !== 0
                ?
                    filteredMessages?.map((message, index) => (
                        <div className=
                        {
                        message.senderId === currentUser.id 
                        ? 'message own' 
                        : 'message'
                        } 
                        key={message.createdAt}>
                            {
                            chatType == 'group' 
                            &&
                            message.senderId !== currentUser.id 
                            &&
                            <img src={ message.senderAvatar || './avatar.png'} alt="" />
                            }
                            <div className="texts">
                                {
                                    chatType == 'group' && chat.senderId !== currentUser.id 
                                    &&
                                    <span className='sender'>
                                        {
                                        chatType == 'group' 
                                        &&
                                        message.senderId !== currentUser.id 
                                        &&
                                        message.senderUsername
                                        }
                                    </span>
                                }
                                {
                                    message.img &&
                                    <img src={message.img} alt="" />
                                }
                                <p>
                                    {message?.text}
                                </p>
                                <div className='info'>
                                {
                                    format(message.createdAt.toDate())
                                }
                                {
                                    index == filteredMessages.length - 1 &&
                                    seen &&
                                    chatType !== 'group' &&
                                    message.senderId === currentUser.id &&
                                    <img className='seen'
                                    src=
                                    {
                                        isCurrentUserBlocked
                                        ||
                                        isReceiverBlocked
                                        ? './avatar.png' 
                                        : user.avatar || './avatar.png'
                                    }
                                    ></img>
                                }
                                {
                                    message.senderId === currentUser.id &&
                                    <img className='delete' src="trash.png" alt="" 
                                    onClick={() => handleMessageDelete(message)}
                                    />
                                }
                                </div>
                            </div>
                        </div>
                    ))
                :
                <h1 className='text-center'>No messages found.</h1>
                :
                <div className='text-center'>
                    <h1>No messages were Sent yet.</h1>
                    <h3>Start by typing a message</h3>
                </div>
            }
                {
                img.url &&
                    <div className="message own">
                        <div className="texts">
                            <img src={img.url} alt="" />
                        </div>
                    </div>
                }
                <div ref={endRef}></div>

            </div>
            <form action="" className='bottom'
            onSubmit={e => e.preventDefault()}
            >
                <label htmlFor="file"
                className={isCurrentUserBlocked || isReceiverBlocked || loading ? 'disabled' : ''}
                >
                    <img src="./img.png" alt="" />
                </label>
                <input type="file" id='file' hidden onChange={handleImg} 
                disabled={isCurrentUserBlocked || isReceiverBlocked || loading}
                accept="image/jpeg, image/png, image/jpg"
                />
                <input className="text" autoFocus
                placeholder= {
                    isCurrentUserBlocked 
                    ? 'You are blocked!' 
                    : isReceiverBlocked 
                    ? 'User blocked' 
                    : loading
                    ? 'Sending Message..'
                    : 'Type a message...'
                }
                value={text}
                onChange={e => setText(e.target.value)}
                disabled={isCurrentUserBlocked || isReceiverBlocked || loading}
                />
                <div
                    className={isCurrentUserBlocked || isReceiverBlocked || loading ? 'emoji disabled' : 'emoji'}
                >
                    <img src="./emoji.png" alt=""
                    onClick={() => {
                        !isCurrentUserBlocked && !isReceiverBlocked 
                        && setEmojiMode(prev => !prev)
                    }}
                    />
                    <div className="picker" ref={emojiMoodRef}>
                        <EmojiPicker 
                        open={emojiMood} 
                        theme={'dark'}
                        onEmojiClick={handleEmoji} 
                        />
                    </div>
                </div>
                <button className='send-button' onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked || loading}>Send</button>
            </form>
            {
            detailMode && <Detail groupMembers={chat.groupMembers} section={section} customRef={detailMoeRef} createdAt={chat.createdAt}/>
            }
        </div>
        </>
    )
}