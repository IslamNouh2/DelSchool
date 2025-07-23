import api from "./api";


export async function fetchUser() {
    try {
        const res = await api.get("/auth/me", { withCredentials: true });
       // console.log(res.data)
        return res.data.user;
        
    } catch (err) {
        console.error("Failed to fetch user", err);
        return null;
    }
}