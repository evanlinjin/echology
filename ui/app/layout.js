import "@styles/global.css";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import { CoinContextProvider } from "@app/context/coins";
import ErrorDialog from "@components/ErrorDialog";

const ibmPlexMonoLocal = localFont({
  src: [
    {
      path: "./font/IBMPlexMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./font/IBMPlexMono-Regular.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./font/IBMPlexMono-Regular.ttf",
      weight: "600",
      style: "normal",
    },
  ],
});

// const ibmPlexMono = IBM_Plex_Mono({
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-ibmPlexMono",
//   weight: ["100", "200", "300", "400", "500", "600", "700"],
// });

export const metadata = {
  title: "Echology",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      // className={`${ibmPlexMono.className} ${ibmPlexMonoLocal.className} tracking-[1px]`}
      className={`${ibmPlexMonoLocal.className} tracking-[1px]`}
    >
      <head>
        <title>Echology</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <main className="app">
          <div className="main_frame_no_padding grid place-items-center">
            <CoinContextProvider>
              <ErrorDialog />
              {children}
            </CoinContextProvider>
          </div>
        </main>
      </body>
    </html>
  );
}
