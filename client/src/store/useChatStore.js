import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/users");
            set({
                users: [...res.data, {
                    _id: "ai-bot",
                    fullName: "AI Assistant",
                    profilePic: "https://ui-avatars.com/api/?name=AI+Assistant&background=random",
                    email: "ai@bot.com",
                    isAIBot: true
                }]
            });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            if (userId === "ai-bot") {
                set({ messages: [] }); // Start with empty or persistent local mock history if desired
                return;
            }
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isMessagesLoading: false });
        }
    },
    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            if (selectedUser.isAIBot) {
                const myMessage = {
                    _id: Date.now(),
                    senderId: useAuthStore.getState().authUser._id,
                    text: messageData.text,
                    image: messageData.image,
                    createdAt: new Date().toISOString(),
                };
                set({ messages: [...messages, myMessage] });

                setTimeout(() => {
                    const aiMessage = {
                        _id: Date.now() + 1,
                        senderId: "ai-bot",
                        text: "This is a simulated AI response to: " + messageData.text,
                        createdAt: new Date().toISOString(),
                    };
                    set({ messages: [...get().messages, aiMessage] });
                }, 1000);
                return;
            }

            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: [...messages, res.data] });
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if (!isMessageSentFromSelectedUser) return;

            set({
                messages: [...get().messages, newMessage],
            });
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
