import './Chat.css';
import Detail from './detail/Detail';
import { useEffect, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react'
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useUserStore } from '../../lib/UserStore';
import { useChatStore } from '../../lib/ChatStore';
import { upload } from '../../lib/upload'
import { format } from "timeago.js";

export default function Chat(){
    const [chat,setChat] = useState(false);
    const [loading,setLoading] = useState(false);
    const [emojiMood,setEmojiMode] = useState(false);
    const [searchMode,setSearchMode] = useState(false);
    const [detailMode,setDetailMode] = useState(false);
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

    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, resetChat } = useChatStore();
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
        })

        return () =>{
            unSub()
        }
    }, [user])

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

        let imgFile = img.file;

        setImg({
            file: null,
            url: ''
        })

        try{

            //sending image

            if(imgFile) imgUrl = await upload(imgFile)

            await updateDoc(doc(db, 'chats', chatId),{
                messages: arrayUnion({
                    senderId: currentUser.id,
                    text: currentText,
                    createdAt: new Date(),
                    ...(imgUrl && {img: imgUrl})
                })
            });

            //clearing inputs

            //updating chat in chat list

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
        });

        setLoading(false)

        }catch(err){

        }
    }

    function handleSectionChange(){
        document.querySelector('.hidden').classList.remove('hidden');
        section.current.classList.add('hidden');

        resetChat();
    }

    const filteredMessages = chat.messages?.filter(
        c => c.text.toLowerCase().includes(input.toLocaleLowerCase())
    )

    return(
        <>
        <div className='chat' ref={section}>
            <div className='top'>
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
                filteredMessages?.map(message => (
                    <div className={message.senderId === currentUser.id ? 'message own' : 'message'} key={message.createdAt}>
                        <div className="texts">
                            {message.img &&
                                <img src={message.img} alt="" />
                            }
                            <p>
                                {message?.text}
                            </p>
                            <span>
                            {
                                format(message.createdAt.toDate())
                            }
                            </span>
                        </div>
                    </div>
                ))
            }
                {img.url &&
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
                        onEmojiClick={handleEmoji} 
                        pickerStyle={{ width: "50%" }} 
                        />
                    </div>
                </div>
                <button className='send-button' onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked || loading}>Send</button>
            </form>
            {
            detailMode && <Detail customRef={detailMoeRef} createdAt={chat.createdAt}/>
            }
        </div>
        </>
    )
}