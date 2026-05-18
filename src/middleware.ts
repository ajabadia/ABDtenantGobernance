import { proxy } from './proxy';

export default proxy;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.svg$).*)'],
};
