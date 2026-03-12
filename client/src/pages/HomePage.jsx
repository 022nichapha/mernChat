import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
    const { selectedUser } = useChatStore();

    return (
        <div className="h-dvh bg-base-200">
            <div className="flex items-center justify-center pt-20 px-4">
                <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100dvh-8rem)]">
                    <div className="flex h-full rounded-lg overflow-hidden">
                        {/* Mobile: ซ่อน Sidebar เมื่อเลือก user แล้ว, Desktop: แสดงตลอด */}
                        <div className={`${selectedUser ? "hidden" : "w-full"} lg:block lg:w-auto`}>
                            <Sidebar />
                        </div>

                        {/* Mobile: แสดง ChatContainer เต็มจอเมื่อเลือก user, Desktop: แสดงตลอด */}
                        <div className={`${selectedUser ? "w-full" : "hidden"} lg:flex lg:flex-1`}>
                            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default HomePage;
