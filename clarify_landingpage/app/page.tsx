import { Background } from "@/components/background"
import { Footer } from "@/components/footer"
import { Hero } from "@/components/hero"
import { VideoPreview } from "@/components/video-preview"

export default function Home() {
  return (
    <main className="p-inset h-[100dvh] w-full">
      <div className="relative h-full w-full">
        <Background src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6630c6a18475e11eb9c431f89de4698c%20%281%29-0BqOUuQxMRffdYWkMpS0J5Ql2lX38s.jpg" />
        <Hero />
        <Footer />
        <VideoPreview 
          src="/videos/clarify-demo.mp4"
          placeholder="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6630c6a18475e11eb9c431f89de4698c%20%281%29-0BqOUuQxMRffdYWkMpS0J5Ql2lX38s.jpg"
          title="Watch Video"
        />
      </div>
    </main>
  )
}
