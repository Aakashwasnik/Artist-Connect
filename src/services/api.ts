import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const artistService = {
  getArtists: () => api.get('/artists'),
  getArtistById: (id: string) => api.get(`/artists/${id}`),
};

export const bookingService = {
  createBooking: (data: any) => api.post('/bookings', data),
  getBookings: (artistId?: string) => api.get('/bookings', { params: { artistId } }),
  updateBookingStatus: (id: string, status: string) => api.patch(`/bookings/${id}/status`, { status }),
};

export const authService = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
};

export default api;
