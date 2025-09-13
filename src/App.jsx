import AuthButton from './components/AuthButton'
import UploadBox from './components/UploadBox'

export default function App() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-500 to-black text-neutral-100 relative">
      <div className="absolute right-3 top-3 sm:right-4 sm:top-4"><AuthButton /></div>

      <div className="grid min-h-screen place-items-center px-3 sm:px-6 py-8">
        <div className="w-full max-w-xl">
          <h1 className="mb-6 text-center text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight
                         bg-clip-text text-transparent bg-gradient-to-br from-orange-200 via-amber-200 to-white">
            Roast<span className="text-orange-300">AI</span>
          </h1>
          <UploadBox />
        </div>
      </div>
    </main>
  )
}
