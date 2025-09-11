import AuthButton from './components/AuthButton'

export default function App() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-500 to-black text-neutral-100 relative">
      <div className="absolute right-4 top-4">
        <AuthButton />
      </div>

      <div className="grid h-screen place-items-center">
        <h1
          className="text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight
                     bg-clip-text text-transparent bg-gradient-to-br from-orange-200 via-amber-200 to-white drop-shadow"
        >
          Roast<span className="text-orange-300">AI</span>
        </h1>
      </div>
    </main>
  )
}
