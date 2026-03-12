import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

export const useAuthStore = create(
    devtools((set, get) => ({
        authUser: null,
        isRegistering: false,
        isLoggingIn: false,
        isUpdatingProfile: false,
        isCheckingAuth: true,
        onlineUsers: [],
        socket: null,

        checkAuth: async () => {
            try {
                const res = await axiosInstance.get("/user/check");
                set({ authUser: res.data });
                get().connectSocket();
            } catch (error) {
                console.log("Error in checkAuth:", error);
                set({ authUser: null });
            } finally {
                set({ isCheckingAuth: false });
            }
        },

        register: async (data) => {
            set({ isRegistering: true });
            try {
                const res = await axiosInstance.post("/user/register", data);
                set({ authUser: res.data });
                toast.success("Account created successfully");
                get().connectSocket();
            } catch (error) {
                toast.error(error.response.data.message);
            } finally {
                set({ isRegistering: false });
            }
        },

        login: async (data) => {
            set({ isLoggingIn: true });
            try {
                const res = await axiosInstance.post("/user/login", data);
                set({ authUser: res.data });
                toast.success("Logged in successfully");
                get().connectSocket();
            } catch (error) {
                toast.error(error.response.data.message);
            } finally {
                set({ isLoggingIn: false });
            }
        },

        logout: async () => {
            try {
                await axiosInstance.post("/user/logout");
                set({ authUser: null });
                toast.success("Logged out successfully");
                get().disconnectSocket();
            } catch (error) {
                toast.error(error.response.data.message);
            }
        },

        updateProfile: async (data) => {
            set({ isUpdatingProfile: true });
            try {
                const res = await axiosInstance.put("/user/update-profile", data);
                set({ authUser: res.data });
                toast.success("Profile updated successfully");
            } catch (error) {
                console.log("error in update profile:", error);
                toast.error(error.response.data.message);
            } finally {
                set({ isUpdatingProfile: false });
            }
        },

        connectSocket: () => {
            // สร้างเพื่อจะเก็บข้อมูล socket id ของ user
            const { authUser } = get();
            // ดึงค่า authUser กับ socket ที่เชื่อมต่ออยู่ โดย การ get() คือการดึงค่าจาก store
            if (!authUser || get().socket?.connected) return;

            const socket = io(BASE_URL, {
                // การส่ง query คือการส่งข้อมูลร้องขอ โดยมี key คือ userId และ value คือ authUser._id
                query: {
                    userId: authUser._id,
                },
            });
            socket.connect();

            set({ socket: socket });
            // socket.on("getOnlineUsers", (userIds) โดย  userId จะมีมาเยอะจึงใส่ ...userIds 
            socket.on("getOnlineUsers", (userIds) => {
                set({ onlineUsers: userIds });
            });
        },
        disconnectSocket: () => {
            if (get().socket?.connected) get().socket.disconnect();
        },
    }), { name: "AuthStore" }));
