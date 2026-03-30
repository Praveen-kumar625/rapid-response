import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { UserProvider } from '@auth0/nextjs-auth0';
import { SocketProvider } from '../src/context/socket';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <SocketProvider>
        <Component {...pageProps} />
      </SocketProvider>
    </UserProvider>
  );
}
