"use client"

import { useState, useEffect } from "react"
import { Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, RefreshCw, Zap, CheckCircle, XCircle } from "lucide-react"
import { BrowserProvider, parseEther, formatEther, Contract } from "ethers"

// Contract ABI (simplified for demo)
const LENDING_PROTOCOL_ABI = [
  "function depositCollateral(uint256 amount) external",
  "function borrow(uint256 amount) external",
  "function repay() external payable",
  "function withdrawCollateral() external",
  "function getUserData(address user) external view returns (uint256, uint256, uint256)",
]

const COLLATERAL_TOKEN_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
]

interface Toast {
  id: number
  title: string
  description: string
  type: "success" | "error" | "info"
}

export default function DeFiLendingApp() {
  const [account, setAccount] = useState<string>("")
  const [provider, setProvider] = useState<any>(null)
  const [signer, setSigner] = useState<any>(null)
  const [lendingContract, setLendingContract] = useState<any>(null)
  const [collateralContract, setCollateralContract] = useState<any>(null)
  const [userBalance, setUserBalance] = useState<string>("0")
  const [collateralAmount, setCollateralAmount] = useState<string>("0")
  const [debtAmount, setDebtAmount] = useState<string>("0")
  const [interestAccrued, setInterestAccrued] = useState<string>("0")
  const [depositInput, setDepositInput] = useState<string>("")
  const [borrowInput, setBorrowInput] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Contract addresses (these would come from environment variables)
  const LENDING_PROTOCOL_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x..."
  const COLLATERAL_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS || "0x..."

  const showToast = (title: string, description: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now()
    const newToast = { id, title, description, type }
    setToasts((prev) => [...prev, newToast])

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  useEffect(() => {
    if (account && provider) {
      loadUserData()
    }
  }, [account, provider])

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        showToast("MetaMask not found", "Please install MetaMask to continue", "error")
        return
      }

      setIsLoading(true)
      const provider = new BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()

      setProvider(provider)
      setSigner(signer)
      setAccount(accounts[0])

      // Initialize contracts
      const lendingContract = new Contract(LENDING_PROTOCOL_ADDRESS, LENDING_PROTOCOL_ABI, signer)
      const collateralContract = new Contract(COLLATERAL_TOKEN_ADDRESS, COLLATERAL_TOKEN_ABI, signer)

      setLendingContract(lendingContract)
      setCollateralContract(collateralContract)

      showToast("Wallet Connected", `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`, "success")
    } catch (error) {
      console.error("Error connecting wallet:", error)
      showToast("Connection Failed", "Failed to connect wallet", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserData = async () => {
    try {
      if (!lendingContract || !collateralContract || !account) return

      // Get user data from lending protocol
      const userData = await lendingContract.getUserData(account)
      setCollateralAmount(formatEther(userData[0]))
      setDebtAmount(formatEther(userData[1]))
      setInterestAccrued(formatEther(userData[2]))

      // Get user token balance
      const balance = await collateralContract.balanceOf(account)
      setUserBalance(formatEther(balance))
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const deposit = async () => {
    try {
      if (!depositInput || !lendingContract || !collateralContract) return

      setIsLoading(true)
      const amount = parseEther(depositInput)

      // Check allowance
      const allowance = await collateralContract.allowance(account, LENDING_PROTOCOL_ADDRESS)
      if (allowance.lt(amount)) {
        const approveTx = await collateralContract.approve(LENDING_PROTOCOL_ADDRESS, amount)
        await approveTx.wait()
      }

      // Deposit collateral
      const tx = await lendingContract.depositCollateral(amount)
      await tx.wait()

      showToast("Deposit Successful", `Deposited ${depositInput} cUSD as collateral`, "success")

      setDepositInput("")
      loadUserData()
    } catch (error) {
      console.error("Error depositing:", error)
      showToast("Deposit Failed", "Failed to deposit collateral", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const borrow = async () => {
    try {
      if (!borrowInput || !lendingContract) return

      setIsLoading(true)
      const amount = parseEther(borrowInput)

      const tx = await lendingContract.borrow(amount)
      await tx.wait()

      showToast("Borrow Successful", `Borrowed ${borrowInput} dDAI`, "success")

      setBorrowInput("")
      loadUserData()
    } catch (error) {
      console.error("Error borrowing:", error)
      showToast("Borrow Failed", "Failed to borrow tokens. Check collateralization ratio.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const repay = async () => {
    try {
      if (!lendingContract) return

      setIsLoading(true)
      const totalDebt = Number.parseFloat(debtAmount) + Number.parseFloat(interestAccrued)
      const tx = await lendingContract.repay({ value: parseEther(totalDebt.toString()) })
      await tx.wait()

      showToast("Repayment Successful", "Loan repaid successfully", "success")

      loadUserData()
    } catch (error) {
      console.error("Error repaying:", error)
      showToast("Repayment Failed", "Failed to repay loan", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const withdraw = async () => {
    try {
      if (!lendingContract) return

      setIsLoading(true)
      const tx = await lendingContract.withdrawCollateral()
      await tx.wait()

      showToast("Withdrawal Successful", "Collateral withdrawn successfully", "success")

      loadUserData()
    } catch (error) {
      console.error("Error withdrawing:", error)
      showToast("Withdrawal Failed", "Failed to withdraw collateral. Ensure no active debt.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateCollateralizationRatio = () => {
    const collateral = Number.parseFloat(collateralAmount)
    const debt = Number.parseFloat(debtAmount)
    if (debt === 0) return "∞"
    return ((collateral / debt) * 100).toFixed(1)
  }

  const getMaxBorrowAmount = () => {
    const collateral = Number.parseFloat(collateralAmount)
    return (collateral * 0.66).toFixed(4) // 66% of collateral value
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.1),transparent_50%)]" />

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 p-4 rounded-lg backdrop-blur-sm border max-w-sm
              ${toast.type === "success" ? "bg-green-900/50 border-green-500 text-green-100" : ""}
              ${toast.type === "error" ? "bg-red-900/50 border-red-500 text-red-100" : ""}
              ${toast.type === "info" ? "bg-blue-900/50 border-blue-500 text-blue-100" : ""}
              animate-in slide-in-from-right duration-300
            `}
          >
            {toast.type === "success" && <CheckCircle className="h-5 w-5 text-green-400" />}
            {toast.type === "error" && <XCircle className="h-5 w-5 text-red-400" />}
            {toast.type === "info" && <Zap className="h-5 w-5 text-blue-400" />}
            <div className="flex-1">
              <div className="font-semibold text-sm">{toast.title}</div>
              <div className="text-xs opacity-90">{toast.description}</div>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-white/60 hover:text-white transition-colors">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              NexusLend Protocol
            </h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            The next generation of decentralized lending. Secure, fast, and transparent.
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex justify-center mb-8">
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="
                bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 
                text-white px-8 py-3 text-lg rounded-lg font-semibold
                flex items-center gap-2 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg hover:shadow-xl
              "
            >
              <Wallet className="h-5 w-5" />
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="border border-cyan-500 text-cyan-400 px-4 py-2 rounded-lg bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
              </div>
              <button
                onClick={loadUserData}
                className="
                  border border-slate-600 text-slate-300 hover:bg-slate-800 
                  p-2 rounded-lg transition-colors duration-200
                "
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {account && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Portfolio Overview */}
            <div className="lg:col-span-3 bg-slate-900/50 border border-slate-700 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
                <h2 className="text-xl font-semibold text-slate-100">Portfolio Overview</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Wallet Balance</p>
                  <p className="text-2xl font-bold text-slate-100">{Number.parseFloat(userBalance).toFixed(4)}</p>
                  <p className="text-slate-500 text-xs">cUSD</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Collateral</p>
                  <p className="text-2xl font-bold text-cyan-400">{Number.parseFloat(collateralAmount).toFixed(4)}</p>
                  <p className="text-slate-500 text-xs">cUSD</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Debt</p>
                  <p className="text-2xl font-bold text-purple-400">{Number.parseFloat(debtAmount).toFixed(4)}</p>
                  <p className="text-slate-500 text-xs">dDAI</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Interest</p>
                  <p className="text-2xl font-bold text-orange-400">{Number.parseFloat(interestAccrued).toFixed(4)}</p>
                  <p className="text-slate-500 text-xs">dDAI</p>
                </div>
              </div>

              <div className="my-6 h-px bg-slate-700" />

              <div className="flex justify-center">
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Collateralization Ratio</p>
                  <p className="text-3xl font-bold text-green-400">{calculateCollateralizationRatio()}%</p>
                  <p className="text-slate-500 text-xs">Minimum: 150%</p>
                </div>
              </div>
            </div>

            {/* Deposit Collateral */}
            <div className="bg-slate-900/50 border border-slate-700 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowDownCircle className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-slate-100">Deposit Collateral</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6">Deposit cUSD tokens as collateral</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="deposit" className="block text-slate-300 text-sm font-medium mb-2">
                    Amount (cUSD)
                  </label>
                  <input
                    id="deposit"
                    type="number"
                    placeholder="0.00"
                    value={depositInput}
                    onChange={(e) => setDepositInput(e.target.value)}
                    className="
                      w-full bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500
                      px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                      transition-all duration-200
                    "
                  />
                </div>
                <button
                  onClick={deposit}
                  disabled={!depositInput || isLoading}
                  className="
                    w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700
                    text-white py-3 rounded-lg font-semibold transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-lg hover:shadow-xl
                  "
                >
                  {isLoading ? "Processing..." : "Deposit Collateral"}
                </button>
              </div>
            </div>

            {/* Borrow */}
            <div className="bg-slate-900/50 border border-slate-700 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowUpCircle className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-slate-100">Borrow</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6">Borrow dDAI against your collateral</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="borrow" className="block text-slate-300 text-sm font-medium mb-2">
                    Amount (dDAI)
                  </label>
                  <input
                    id="borrow"
                    type="number"
                    placeholder="0.00"
                    value={borrowInput}
                    onChange={(e) => setBorrowInput(e.target.value)}
                    className="
                      w-full bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500
                      px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                      transition-all duration-200
                    "
                  />
                  <p className="text-xs text-slate-500 mt-1">Max: {getMaxBorrowAmount()} dDAI</p>
                </div>
                <button
                  onClick={borrow}
                  disabled={!borrowInput || isLoading || Number.parseFloat(collateralAmount) === 0}
                  className="
                    w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700
                    text-white py-3 rounded-lg font-semibold transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-lg hover:shadow-xl
                  "
                >
                  {isLoading ? "Processing..." : "Borrow"}
                </button>
              </div>
            </div>

            {/* Repay & Withdraw */}
            <div className="bg-slate-900/50 border border-slate-700 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Manage Position</h3>
              <p className="text-slate-400 text-sm mb-6">Repay loans and withdraw collateral</p>

              <div className="space-y-4">
                <button
                  onClick={repay}
                  disabled={isLoading || Number.parseFloat(debtAmount) === 0}
                  className="
                    w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700
                    text-white py-3 rounded-lg font-semibold transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-lg hover:shadow-xl
                  "
                >
                  {isLoading
                    ? "Processing..."
                    : `Repay Loan (${(Number.parseFloat(debtAmount) + Number.parseFloat(interestAccrued)).toFixed(4)} dDAI)`}
                </button>
                <button
                  onClick={withdraw}
                  disabled={isLoading || Number.parseFloat(debtAmount) > 0 || Number.parseFloat(collateralAmount) === 0}
                  className="
                    w-full border border-slate-600 text-slate-300 hover:bg-slate-800 
                    py-3 rounded-lg font-semibold transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {isLoading ? "Processing..." : "Withdraw Collateral"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Protocol Info */}
        <div className="mt-8 bg-slate-900/30 border border-slate-700 backdrop-blur-sm rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="text-slate-300 font-semibold mb-2">Collateralization Ratio</h3>
              <p className="text-slate-400 text-sm">Minimum 150% required</p>
            </div>
            <div>
              <h3 className="text-slate-300 font-semibold mb-2">Interest Rate</h3>
              <p className="text-slate-400 text-sm">5% weekly (fixed)</p>
            </div>
            <div>
              <h3 className="text-slate-300 font-semibold mb-2">Exchange Rate</h3>
              <p className="text-slate-400 text-sm">1 cUSD = 1 dDAI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
