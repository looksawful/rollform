export const isDarkPath = (pathname: string): boolean =>
  pathname === '/dark' || pathname.startsWith('/dark/');

export const themeHref = (pathname: string, href: string): string =>
  isDarkPath(pathname) ? '/dark' + href : href;
