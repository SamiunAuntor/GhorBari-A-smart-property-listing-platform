import axios from "axios";

// create axios instance
const axiosInstance = axios.create({
    // prod url : https://ghorbari-a-smart-property-listing.onrender.com/
    baseURL: import.meta.env.VITE_API_URL || `http://localhost:5000`, // will need to replaace this one when we deploy the project
});

const useAxios = () => {
    return axiosInstance;
};

export default useAxios;
