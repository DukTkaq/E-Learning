const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:3000';

export const resolveAssetUrl = (path) => {
  if (!path) return '';
  return path.startsWith('/') ? `${API_ORIGIN}${path}` : path;
};
