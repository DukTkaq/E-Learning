const ROLE_HOMES = {
  1: '/admin/dashboard',
  2: '/instructor/courses',
  3: '/',
};

export const sanitizeInternalPath = (value, fallback = '/') => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
};

export const buildLoginHandoff = (courseId, returnTo) => {
  const safeReturnTo = sanitizeInternalPath(returnTo);
  return {
    loginPath: `/login?returnTo=${encodeURIComponent(safeReturnTo)}`,
    intent: {
      type: 'ADD_TO_CART',
      courseId: String(courseId),
      returnTo: safeReturnTo,
    },
  };
};

export const resolvePostLoginDestination = (roleId, requestedReturnTo) => {
  if (Number(roleId) !== 3) return ROLE_HOMES[roleId] || '/';
  return sanitizeInternalPath(requestedReturnTo);
};
