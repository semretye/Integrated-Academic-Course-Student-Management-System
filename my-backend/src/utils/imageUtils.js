export const getImageUrl = (path) => {
  if (!path) return '/images/default-profile.png'; // Local fallback
  if (path.startsWith('http')) return path; // Already full URL
  return `http://localhost:8080/${path}`; // Prepend backend URL
};