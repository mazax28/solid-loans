import { Github, Twitter, DiscIcon as Discord, Globe } from "lucide-react"
import { Logo } from "./branding"

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Logo size="lg" />
            <p className="text-slate-400 mt-4 max-w-md">
              The next generation of decentralized lending. Built on Ethereum, secured by smart contracts, powered by
              community.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="#"
                className="text-slate-400 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
              >
                <Discord className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
              >
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Protocol */}
          <div>
            <h3 className="text-slate-200 font-semibold mb-4">Protocol</h3>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors py-1 block">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors py-1 block">
                  Security
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors py-1 block">
                  Governance
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors py-1 block">
                  Analytics
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-slate-200 font-semibold mb-4">Community</h3>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors py-1 block">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors py-1 block">
                  Forum
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors py-1 block">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-400 transition-colors py-1 block">
                  Bug Bounty
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm">© 2025 NexusLend Protocol. All rights reserved.</p>
          <p className="text-slate-500 text-sm mt-2 md:mt-0">Built with ❤️ for the DeFi community</p>
        </div>
      </div>
    </footer>
  )
}
