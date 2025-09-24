import axios from "axios";

const api=axios.create({
    baseURL: 'http://localhost:5188/DndApi',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Include token if
        // available
    }
});

export default api;