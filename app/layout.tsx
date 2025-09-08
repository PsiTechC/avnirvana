


// // app/layout.tsx
// import type React from "react"
// import type { Metadata } from "next"
// import { Playfair_Display, Source_Sans_3 } from "next/font/google"
// import "./globals.css"
// import BackgroundWrapper from "@/components/BackgroundWrapper"

// const playfairDisplay = Playfair_Display({
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-playfair",
//   weight: ["400", "600", "700"],
// })

// const sourceSans = Source_Sans_3({
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-source-sans",
//   weight: ["400", "500", "600"],
// })

// export const metadata: Metadata = {
//   title: "Business Dashboard - Brand & Product Management",
//   description:
//     "Professional dashboard for managing brands, products, dealers, and quotations",
//   generator: "v0.app",
// }

// export default function RootLayout({
//   children,
// }: Readonly<{ children: React.ReactNode }>) {
//   return (
//     <html
//       lang="en"
//       className={`${playfairDisplay.variable} ${sourceSans.variable} antialiased`}
//     >
//       {/* NOTE: with-animated-bg => transparent body, glass-all => blur surfaces */}
//       <body className="font-sans with-animated-bg glass-all">
//         {/* Ocean gradient sits under the animated canvas */}
//         <div className="relative min-h-screen bg-ocean">
//           <BackgroundWrapper />
//           <div className="relative z-10 chrome-offset">{children}</div>
//         </div>
//       </body>
//     </html>
//   )
// }


import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

export const metadata: Metadata = {
  title: "Business Dashboard - Brand & Product Management",
  description: "Professional dashboard for managing brands, products, dealers, and quotations",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${geist.variable} antialiased`}>
      <body className="font-sans bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}


// import type React from "react"
// import type { Metadata } from "next"
// import { Inter, Geist } from "next/font/google"
// import "./globals.css"

// const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" })
// const geist = Geist({ subsets: ["latin"], display: "swap", variable: "--font-geist" })

// export const metadata: Metadata = {
//   title: "Business Dashboard - Brand & Product Management",
//   description: "Professional dashboard for managing brands, products, dealers, and quotations",
// }

// export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
//   return (
//     <html lang="en" className={`${inter.variable} ${geist.variable} antialiased`}>
//       {/* add with-animated-bg so the body/bg-background become transparent */}
//       <body className="font-sans with-animated-bg text-gray-900">
//         {/* background glow (behind everything) */}
//         <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
//           <div className="absolute inset-0 w-full h-full" style={{borderRadius: '0'}}>
//             <div className="w-full h-full bg-radial-[at_50%_75%] from-blue-900 via-indigo-900 to-black to-90%" style={{borderRadius: '0'}} />
//             {/* optional softening:
//             <div className="w-full h-full bg-radial-[at_50%_75%] from-sky-200 via-blue-400 to-indigo-900 to-90% blur-3xl opacity-60" style={{borderRadius: '0'}} />
//             */}
//           </div>
//         </div>

//         <div className="relative min-h-screen">{children}</div>
//       </body>
//     </html>
//   )
// }
