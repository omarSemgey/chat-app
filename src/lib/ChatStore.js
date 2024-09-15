import { create } from "zustand";
import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
    chatId: null,
    chatType: null,
    user: null,
    groupImg: null,
    groupName: null,
    isCurrentUserBlocked: false,
    isReceiverBlocked: false,
    changeChat: (chatId, chatType ,user, groupName = null, groupImg = null) => {
        if(chatType == 'chat'){

                const currentUser = useUserStore.getState().currentUser;
                
                // CHECK IF CURRENT USER IS BLOCKED

            if (user.blocked.includes(currentUser.id)) {
                return set({
                chatId,
                chatType,
                user: null,
                isCurrentUserBlocked: true,
                isReceiverBlocked: false,
            });
            }

            // CHECK IF RECEIVER IS BLOCKED

            else if (currentUser.blocked.includes(user.id)) {
                return set({
                chatId,
                chatType,
                user: user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: true,
            });
            } else {
                return set({
                chatId,
                chatType,
                user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: false,
            });
            }
        }else{
            set({
                chatId,
                chatType,
                groupName,
                groupImg,
                user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: false,
            });
        }
},

    changeBlock: () => {
        set((state) => ({ ...state, isReceiverBlocked: !state.isReceiverBlocked }));
    },

    resetChat: () => {
    set({
        chatId: null,
        chatType: null,
        groupName: null,
        groupMembers: null,
        user: null,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
    });
    },
}));