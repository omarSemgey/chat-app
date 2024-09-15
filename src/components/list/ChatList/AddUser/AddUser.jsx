import './AddUser.css'
import { useState } from 'react';
import { db } from '../.././../../lib/firebase'
import { useUserStore } from '../.././../../lib/UserStore'
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { upload } from '../../../../lib/upload';

export default function AddUser({addMode,customRef}){
    const { currentUser } = useUserStore()

    const [result,setResult] = useState(null)
    const [exists,setExists] = useState(false);
    const [chatMode,setChatMode] = useState(true)
    const [groupMode,setGroupMode] = useState(false)
    const [loading,setLoading] = useState(false)
    const [creatingGroup,setCreatingGroup] = useState(false)
    const [groupImg,setGroupImg] = useState({
        file:null,
        url:''
    });

    async function handleSearch(e){
        e.preventDefault();
        const formData = new FormData(e.target);
        const searchResult = formData.get('searchResult');
        if(searchResult == currentUser.username) return; 
        setLoading(true);
        setExists(false);

        try{

            if(groupMode){

                const chatsRef = collection(db, 'chats');

                const q = query(chatsRef,
                    where('type', '==', 'group'),
                    where('groupName', '==', searchResult));

                    const querySnapShot = await getDocs(q);

                    if(!querySnapShot.empty){

                        setResult(...[querySnapShot.docs[0].data()]);

                        setResult(prev => ({
                            ...prev,
                            id: querySnapShot.docs[0].id
                        }))

                    }else{

                        setResult('Nothing')

                    }

            }else{

                const usersRef = collection(db, 'users');


                const q = query(usersRef,where('username', '==', searchResult));

                const querySnapShot = await getDocs(q);

                if(!querySnapShot.empty){

                    const docRef = doc(db, 'userchats', currentUser.id);

                    const docSnap = await getDoc(docRef);

                    docSnap.data().chats.map(chat =>{
                        return chat.receiverId == querySnapShot.docs[0].data().id && setExists(true);
                    })

                    setResult(...[querySnapShot.docs[0].data()]);

                }else{

                    setResult('Nothing')

                }
            }

        }catch(err){
            toast.error(err.message)
        }
        finally{
            setLoading(false)
        }
    }

    async function handleCreateGroup(e){
        e.preventDefault();

        if(loading) return;

        setLoading(true)

        const formData = new FormData(e.target);

        let groupName = formData.get('groupName');

        if(groupName.length < 3 || groupName.length > 30){
            setLoading(false)
            return toast.error('Group names must be between 3 and 30 characters');
        }

        const chatsRef = collection(db, 'chats')

        const q = query(chatsRef, where("groupName", "==", groupName));

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty){
            setLoading(false)
            return toast.warn("Group name already taken");
        } 


        const usersChatsRef = collection(db, 'userchats')

        try{

            const imgUrl = groupImg.file ? await upload(groupImg.file) : '';

            const newGroupRef = doc(chatsRef);

            await setDoc(newGroupRef,{
                createdAt: serverTimestamp(),
                type: 'group',
                groupName,
                groupImg: imgUrl,
                groupMembers: [currentUser.id],
                messages: [],
            });

            //add group to you

            await updateDoc(doc(usersChatsRef, currentUser.id),{
                chats: arrayUnion({
                    chatId: newGroupRef.id,
                    lastMessage: '',
                    type: 'group',
                    groupName,
                    groupImg: imgUrl,
                    updatedAt: Date.now(),
                })
            })

            toast.success('chat added successfully')

        }catch(err){
            console.log(err)
            toast.error(err.message)
        }
        finally{
            addMode(false);
            setLoading(false)
        }
    }

    async function handleChat(){

        setLoading(true)

        if(exists) return;

        const chatRef = collection(db, 'chats')
        const usersChatsRef = collection(db, 'userchats')

        try{

            const newChatRef = doc(chatRef);

            const receiverChats = doc(usersChatsRef, result.id);

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

                await updateDoc(doc(usersChatsRef, result.id),{
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
                    receiverId: result.id,
                    updatedAt: Date.now(),
                })
            })

            toast.success('chat added successfully')

        }catch(err){
            console.log(err)
            toast.error(err.message)
        }
        finally{
            addMode(false);
            setLoading(false)
        }
    }

    async function handleGroup(){

        setLoading(true);

        if(exists) return;

        const usersChatsRef = collection(db, 'userchats')

        const groupChatRef = collection(db, 'chats')

        try{
            //update chat group members

            await updateDoc(doc(groupChatRef, result.id),{
                groupMembers: arrayUnion(currentUser.id)
            })

            //add group to you

            await updateDoc(doc(usersChatsRef, currentUser.id),{
                chats: arrayUnion({
                    chatId: result.id,
                    lastMessage: '',
                    groupImg: result.groupImg,
                    groupName: result.groupName,
                    type: 'group',
                    updatedAt: Date.now(),
                })
            })

            toast.success('chat added successfully')

        }catch(err){
            console.log(err)
            toast.error(err.message)
        }
        finally{
            addMode(false);
            setLoading(false)
        }
    }

    function handleChange(mode){
        if(mode == 'chat'){
            setChatMode(true);
            setGroupMode(false);
        }

        if(mode == 'group'){
            setGroupMode(true);
            setChatMode(false);
        }

    }

    function handleGroupImg(e){
        if(e.target.files[0]){
            const validExtensions = ["image/jpeg", "image/jpg", "image/png"];
            if(validExtensions.includes(e.target.files[0].type)){
                setGroupImg({
                    file: e.target.files[0],
                    url: URL.createObjectURL(e.target.files[0])
                })
            }
        }
    }

    return(
        <>
        <div className={creatingGroup ? 'creating-group' : 'add-user'} ref={customRef}>
            {
                !creatingGroup 
                ?
                <>
                    <div className='change-buttons'>
                        <button
                        className={
                            chatMode
                            ?
                            'active'
                            :
                            ''
                        }
                        disabled={loading}
                        onClick={() => handleChange('chat')}
                        >Chat</button>
                        <button
                        className={
                            groupMode
                            ?
                            'active'
                            :
                            ''
                        }
                        disabled={loading}
                        onClick={() => handleChange('group')}
                        >Group</button>
                    </div>
                    {
                        chatMode &&
                        <div className='chat-mode'>
                            <h2>Add new chat</h2>
                            <form
                            onSubmit={handleSearch}
                            >
                                <input type="search" placeholder='Username' name='searchResult'
                                disabled={loading}
                                />
                                <button
                                disabled={loading}
                                >Search</button>
                            </form>
                            {
                                result !== null && result !== 'Nothing'
                                ?
                                <div className="user">
                                    <div className="details">
                                        <img src={result.avatar || './avatar.png'} alt="" />
                                        <span>{result.username}</span>
                                    </div>
                                    <button onClick={handleChat}
                                    disabled={
                                        loading
                                        ||
                                        exists
                                    }
                                    >{ exists ? 'Chat already exists' : 'Add User'}</button>
                                </div>
                                :
                                result == 'Nothing' &&
                                <span className='no-user'>No user was found</span>
                            }
                        </div>
                    }
                    {
                        groupMode &&
                        <div className='group-mode'>
                            <button className='create-group'
                            disabled={loading}
                            onClick={() => setCreatingGroup(true)}
                            >Create New group</button>
                            <h2>Add new group</h2>
                            <form
                            onSubmit={handleSearch}
                            disabled={loading}
                            >
                                <input type="search" placeholder='Group name' name='searchResult'
                                disabled={loading}
                                />
                                <button
                                disabled={loading}
                                >Search</button>
                            </form>
                            {
                                result !== null && result !== 'Nothing'
                                ?
                                <div className="user">
                                    <div className="details">
                                        <img src={result.groupImg || './avatar.png'} alt="" />
                                        <span>{result.groupName}</span>
                                    </div>
                                    <button onClick={handleGroup}
                                    disabled={
                                        loading
                                        ||
                                        exists
                                    }
                                    >{ exists ? 'Group already exists' :  'Add Group'}</button>
                                </div>
                                :
                                result == 'Nothing' &&
                                <span className='no-user'>No Group was found</span>
                            }
                        </div>
                    }
                </> 
                :
                <>
                <h2>Create New Group</h2>
                <form 
                onSubmit={handleCreateGroup}
                >   
                    <label htmlFor="file"
                    className={loading ? 'disabled' : ''}
                    >
                        <img src={groupImg.url || './avatar.png'} alt="" />
                    </label>
                    <input type="file" id="file" hidden name='groupImg'
                    onChange={handleGroupImg}
                    disabled={loading}
                    />
                    <input type="text" placeholder='Group name' name='groupName'
                    disabled={loading}
                    />
                    <button
                    disabled={loading}
                    >Create Group</button>
                </form>
                </>
            }
        </div>
        </>
    )
}