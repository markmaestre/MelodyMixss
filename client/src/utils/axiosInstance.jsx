import axios from "axios";

const home = "192.168.169.73"; 

const axiosInstance = axios.create({
  baseURL: `http://${home}:4000/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;