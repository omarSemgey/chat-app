import './UserInfo.css'
import { useUserStore } from '../../../lib/UserStore'
import { useEffect, useRef, useState } from 'react';
import UserSettings from '../ChatList/UserSettings/UserSettings';

export default function UserInfo(){
    const { currentUser } = useUserStore();

    const [userSettingsMode,setUserSettingsMode] = useState(false);

    const UserSettingsModeRef = useRef();

    useEffect(()=>{
        document.addEventListener('mousedown',checkClickOutside)
    })

    function checkClickOutside(e){

        if(userSettingsMode && !UserSettingsModeRef.current?.contains(e.target)) setUserSettingsMode(false)

    }

    return(
        <>
        <div className='user-info'>
            <div className='user'>
                <img src={ currentUser.avatar || './avatar.png' } alt="" />
                <h2>{ currentUser.username }</h2>
            </div>
            <div className="icons">
                <img src="./more.png" alt="" 
                onClick={() => setUserSettingsMode(prev => !prev)}
                />
            </div>
            {userSettingsMode && <UserSettings userSettingsMode={setUserSettingsMode} customRef={UserSettingsModeRef}/>}
        </div>
        </>
    )
}