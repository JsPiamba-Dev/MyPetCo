import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'MyPetCo | Bienestar para tu mascota', description: 'Cuida la salud y bienestar de tus mascotas con MyPetCo.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
