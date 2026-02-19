import axios from "axios";

// ต้องระบุให้ถึง /user ตามที่ app.use("/api/v1/user/", userRouter) ใน backend กำหนดไว้
const defaultDevBase = "http://localhost:5000/api/v1";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === "development" ? defaultDevBase : "/api/v1/user");

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true, // สำหรับจัดการ JWT ใน Cookies
});
