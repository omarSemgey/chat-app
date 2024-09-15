import { create } from 'zustand'
import { doc, getDoc } from 'firebase/firestore'
import { db, requestForToken } from './firebase'

export const useUserStore =
    create(set => ({
    currentUser: null,
    isLoading: true,
    fetchUserInfo: async (uid) =>{
        if(!uid) return set({currentUser: null, isLoading: false})

        try{
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);

            if(docSnap.exists()){
                set({currentUser: docSnap.data(), isLoading: false})
                // requestForToken(docSnap.data().token,docSnap.data().id)
            }else{
                set({currentUser: null,isLoading: false})
            }
        }catch(err){
            set({currentUser: null, isLoading: false})
        }

    }
    }));