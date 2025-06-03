import { Zap, Hexagon } from "lucide-react"

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500">
          <Hexagon className={`${sizeClasses[size]} text-white`} />
        </div>
        <div className="absolute -top-1 -right-1">
          <div className="p-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
            <Zap className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          NexusLend
        </span>
        <span className="text-xs text-slate-400 -mt-1">PROTOCOL</span>
      </div>
    </div>
  )
}

export function BrandColors() {
  return {
    primary: "from-cyan-500 to-purple-500",
    secondary: "from-purple-500 to-pink-500",
    accent: "from-cyan-400 to-purple-400",
    text: "from-cyan-400 to-purple-400",
  }
}
