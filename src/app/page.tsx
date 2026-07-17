import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-lg">
        <Image
          src="/hero.jpg"
          alt="Triana Balonmano Vivero"
          width={1024}
          height={1024}
          priority
          unoptimized
          className="h-64 w-64 rounded-xl object-cover sm:h-80 sm:w-80"
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold text-primary">TBV</h1>
        <p className="text-muted-foreground">Triana Balonmano Vivero</p>
        <div className="mt-2">
          <ThemeToggle />
        </div>
      </div>
    </main>
  )
}