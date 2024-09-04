import './List.css'
import { useRef } from 'react'
import UserInfo from './UserInfo/UserInfo'
import ChatList from './ChatList/ChatList'

export default function List(){

    const section = useRef()

    return(
        <>
        <div className='list' ref={section}>
            <UserInfo/>
            <ChatList section={section}/>
        </div>
        </>
    )
}