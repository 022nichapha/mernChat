import { ArrowLeft, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
    const { selectedUser, setSelectedUser } = useChatStore();
    const { onlineUsers } = useAuthStore();

    return (
        <div className="p-2.5 border-b border-base-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* ปุ่มกลับ — แสดงเฉพาะ mobile */}
                    <button
                        onClick={() => setSelectedUser(null)}
                        className="lg:hidden btn btn-sm btn-ghost btn-circle"
                    >
                        <ArrowLeft className="size-5" />
                    </button>

                    {/* Avatar */}
                    <div className="avatar">
                        <div className="size-10 rounded-full relative">
                            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
                        </div>
                    </div>

                    {/* User info */}
                    <div>
                        <h3 className="font-medium">{selectedUser.fullName}</h3>
                        <p className="text-sm text-base-content/70">
                            {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
                        </p>
                    </div>
                </div>

                {/* Close button — แสดงเฉพาะ desktop */}
                <button onClick={() => setSelectedUser(null)} className="hidden lg:block">
                    <X />
                </button>
            </div>
        </div>
    );
};
export default ChatHeader;
