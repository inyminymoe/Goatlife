export function isSafeRedirectPath(path?: string | null): path is string {
  if (!path) {
    return false;
  }

  return path.startsWith('/') && !path.startsWith('//');
}

export function buildLoginRedirectHref(redirectTo?: string | null) {
  if (!isSafeRedirectPath(redirectTo)) {
    return '/login';
  }

  const params = new URLSearchParams({ redirect_to: redirectTo });
  return `/login?${params.toString()}`;
}
