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
      // นำรายชื่อ User จาก DB มาต่อกับ AI Bot ที่เราจำลองขึ้น
      set({
        users: [
          ...res.data,
          {
            _id: "ai-bot",
            fullName: "AI Assistant",
            profilePic:
              "https://ui-avatars.com/api/?name=AI+Assistant&background=random",
            email: "ai@bot.com",
            isAIBot: true,
          },
        ],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      if (userId === "ai-bot") {
        set({ messages: [] }); // สำหรับ AI Bot อาจจะดึงจาก LocalStorage หรือปล่อยว่างไว้
        return;
      }
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      // กรณีคุยกับ AI Bot
      if (selectedUser?.isAIBot) {
        const myMessage = {
          _id: Date.now().toString(),
          senderId: useAuthStore.getState().authUser._id,
          text: messageData.text,
          image: messageData.image,
          createdAt: new Date().toISOString(),
        };
        set({ messages: [...messages, myMessage] });

        // จำลอง AI ตอบกลับหลังจาก 1 วินาที
        setTimeout(() => {
          const aiMessage = {
            _id: (Date.now() + 1).toString(),
            senderId: "ai-bot",
            text: "This is a simulated AI response to: " + messageData.text,
            createdAt: new Date().toISOString(),
          };
          set({ messages: [...get().messages, aiMessage] });
        }, 1000);
        return;
      }

      // กรณีคุยกับ User ปกติ
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser || selectedUser.isAIBot) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return; // ป้องกัน Error ถ้า socket ยังไม่ connect

    // ล้าง Event เก่าก่อนเพื่อป้องกันข้อความซ้ำ (Duplicate Listeners)
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      // ตรวจสอบว่าข้อความที่ส่งมา มาจากคนที่กำลังคุยอยู่ด้วยจริงๆ หรือไม่
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
