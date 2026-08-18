import axios from 'axios';
import Swal from 'sweetalert2';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Response Interceptor: Handle global errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check for 403 Forbidden
    if (error.response && error.response.status === 403) {
      const msg = error.response.data?.message || '';
      
      // Check if the error is a Ban message
      if (msg.toLowerCase().includes('banned') || msg.toLowerCase().includes('ban')) {
        // 1. Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 2. Show SweetAlert2 Popup
        Swal.fire({
          icon: 'error',
          title: 'Account Banned!',
          text: msg,
          confirmButtonText: 'Understood',
          confirmButtonColor: '#ef4444', // Tailwind error color
          allowOutsideClick: false, // Force user to click OK
          backdrop: `rgba(0,0,0,0.8)` // Dark overlay
        }).then(() => {
          // 3. Redirect to login page
          window.location.href = '/login';
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
