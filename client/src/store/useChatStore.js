import { create } from "zustand";
import { devtools } from "zustand/middleware";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create(
    devtools((set, get) => ({
        messages: [],
        users: [],
        selectedUser: null,
        isUsersLoading: false,
        isMessagesLoading: false,

        subscribeToSidebarMessages: () => {
            const socket = useAuthStore.getState().socket;
            if (!socket) return;
            
            // Unsubscribe previous handler if it exists to prevent duplicates
            const prevHandler = get().sidebarHandlerRef;
            if (prevHandler) {
                socket.off("newMessage", prevHandler);
            }
            
            const sidebarHandler = (newMessage) => {
                const state = get();
                const isFromSelectedUser = state.selectedUser && newMessage.senderId === state.selectedUser._id;
                
                set((prev) => {
                    const updatedUsers = prev.users.map((u) => {
                        // Match either if they are the sender, or if we sent a message to them (if backend sent back our own message via socket)
                        const isRelatedUser = u._id === newMessage.senderId || u._id === newMessage.receiverId;
                        if (!isRelatedUser) return u;

                        return {
                            ...u,
                            latestMessage: newMessage,
                            unreadCount: (u._id === newMessage.senderId && !isFromSelectedUser) 
                                            ? (u.unreadCount || 0) + 1 
                                            : u.unreadCount,
                        };
                    });

                    // Sort updated array based on latest message
                    updatedUsers.sort((a,b) => {
                        const timeA = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : 0;
                        const timeB = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : 0;
                        return timeB - timeA;
                    });

                    return { users: updatedUsers };
                });
            };

            socket.on("newMessage", sidebarHandler);
            // Save the ref to be able to off it specifically if needed, although simple enough to keep alive.
            get().sidebarHandlerRef = sidebarHandler;
        },

        unsubscribeFromSidebarMessages: () => {
            const socket = useAuthStore.getState().socket;
            const handler = get().sidebarHandlerRef;
            if (socket && handler) {
                socket.off("newMessage", handler);
            }
        },

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
                toast.error(error.response.data.message || "Failed to fetch users");
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
                toast.error(error.response.data.message || "Failed to fetch messages");
            } finally {
                set({ isMessagesLoading: false });
            }
        },
        markMessagesAsRead: async (senderId) => {
            try {
                await axiosInstance.put(`/messages/mark-read/${senderId}`);
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg.senderId === senderId && !msg.isRead ? { ...msg, isRead: true } : msg
                    ),
                    users: state.users.map((user) =>
                        user._id === senderId ? { ...user, unreadCount: 0 } : user
                    )
                }));
            } catch (error) {
                console.error("Failed to mark messages as read:", error);
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
                set((state) => ({ 
                    messages: [...state.messages, res.data],
                    users: state.users.map(u => 
                        u._id === selectedUser._id ? { ...u, latestMessage: res.data } : u
                    ).sort((a,b) => {
                        const timeA = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : 0;
                        const timeB = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : 0;
                        return timeB - timeA;
                    })
                }));
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to send message");
            }
        },

        subscribeToMessages: () => {
            const { selectedUser } = get();
            if (!selectedUser) return;

            const socket = useAuthStore.getState().socket;
            if (!socket) return;

            // Unsubscribe previous handler to prevent double triggering
            const prevChatHandler = get().chatHandlerRef;
            if (prevChatHandler) {
                socket.off("newMessage", prevChatHandler);
            }

            const chatHandler = (newMessage) => {
                const { selectedUser } = get();
                if (!selectedUser) return;
                
                // Only push to messages array if it's sent from the selected user.
                // Our own sent messages are already pushed locally in sendMessage.
                const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
                
                if (isMessageSentFromSelectedUser) {
                    set(state => ({
                        messages: [...state.messages, newMessage],
                    }));
                    get().markMessagesAsRead(selectedUser._id);
                }
            };
            
            socket.on("newMessage", chatHandler);
            get().chatHandlerRef = chatHandler;

            const prevReadHandler = get().readHandlerRef;
            if (prevReadHandler) {
                socket.off("messagesRead", prevReadHandler);
            }

            const readHandler = ({ readerId }) => {
                const { selectedUser } = get();
                if (selectedUser && selectedUser._id === readerId) {
                    set((state) => ({
                        messages: state.messages.map(msg => ({ ...msg, isRead: true }))
                    }));
                }
            };

            socket.on("messagesRead", readHandler);
            get().readHandlerRef = readHandler;
        },

        unsubscribeFromMessages: () => {
            const socket = useAuthStore.getState().socket;
            if (!socket) return;
            
            const chatHandler = get().chatHandlerRef;
            if (chatHandler) {
                socket.off("newMessage", chatHandler);
            }
            
            const readHandler = get().readHandlerRef;
            if (readHandler) {
                socket.off("messagesRead", readHandler);
            }
        },

        setSelectedUser: (selectedUser) => {
            set({ selectedUser });
            if (selectedUser && selectedUser._id !== "ai-bot") {
                get().markMessagesAsRead(selectedUser._id);
            }
        },
    }), { name: "ChatStore" }));
