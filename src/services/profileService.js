import api from './api';

/* Self-service profile (own record only) */
const profileService = {
  /* GET /api/profile -> own user incl. avatar_url (used to make sure the photo survives a page refresh) */
  get: async () => {
    const { data } = await api.get('/profile');
    return data.user;
  },
  updateName: async (name) => {
    const { data } = await api.put('/profile', { name });
    return data.user;
  },
  uploadPhoto: async (file, onProgress) => {
    const fd = new FormData();
    fd.append('photo', file);
    const { data } = await api.post('/profile/photo', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
    });
    return data.user;
  },
  deletePhoto: async () => {
    const { data } = await api.delete('/profile/photo');
    return data.user;
  },
  changePassword: async ({ currentPassword, password, passwordConfirmation }) => {
    const { data } = await api.put('/profile/password', {
      current_password: currentPassword, password, password_confirmation: passwordConfirmation,
    });
    return data;
  },
};

export default profileService;
