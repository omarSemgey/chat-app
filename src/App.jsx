import List from "./components/list/List"
import Chat from "./components/chat/Chat"
import Login from "./components/login/Login";
import Loading from "./components/Loading/Loading";
import Notification from "./components/notification/Notification";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase"
import { useUserStore } from "./lib/UserStore";
import { useChatStore } from "./lib/ChatStore";

const App = () => {
  const {currentUser, isLoading, fetchUserInfo} = useUserStore();
  const { chatId } = useChatStore();

  useEffect(()=>{
    const unSub = onAuthStateChanged(auth, (user) =>{
      fetchUserInfo(user?.uid)
    })

    return () =>{
      unSub();
    }
  },[fetchUserInfo])

  if(isLoading) return <Loading></Loading>

  return (
    <div className="container">
      {currentUser ? (
        <>
          <List></List>
          {chatId && 
          <>
          <Chat/>
          </>
          }
        </>
        ) :
        <Login></Login>
        }
        <Notification/>
    </div>
  )
}

export default App