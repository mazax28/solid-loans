"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, RefreshCw, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  BrowserProvider,
  parseEther,
  formatEther,
  Contract
} from "ethers"

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
  const { toast } = useToast()

  // Contract addresses (these would come from environment variables)
  const LENDING_PROTOCOL_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x..."
  const COLLATERAL_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS || "0x..."

  useEffect(() => {
    if (account && provider) {
      loadUserData()
    }
  }, [account, provider])

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask to continue",
          variant: "destructive",
        })
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

      toast({
        title: "Wallet Connected",
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      })
    } catch (error) {
      console.error("Error connecting wallet:", error)
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      })
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

      toast({
        title: "Deposit Successful",
        description: `Deposited ${depositInput} cUSD as collateral`,
      })

      setDepositInput("")
      loadUserData()
    } catch (error) {
      console.error("Error depositing:", error)
      toast({
        title: "Deposit Failed",
        description: "Failed to deposit collateral",
        variant: "destructive",
      })
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

      toast({
        title: "Borrow Successful",
        description: `Borrowed ${borrowInput} dDAI`,
      })

      setBorrowInput("")
      loadUserData()
    } catch (error) {
      console.error("Error borrowing:", error)
      toast({
        title: "Borrow Failed",
        description: "Failed to borrow tokens. Check collateralization ratio.",
        variant: "destructive",
      })
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

      toast({
        title: "Repayment Successful",
        description: "Loan repaid successfully",
      })

      loadUserData()
    } catch (error) {
      console.error("Error repaying:", error)
      toast({
        title: "Repayment Failed",
        description: "Failed to repay loan",
        variant: "destructive",
      })
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

      toast({
        title: "Withdrawal Successful",
        description: "Collateral withdrawn successfully",
      })

      loadUserData()
    } catch (error) {
      console.error("Error withdrawing:", error)
      toast({
        title: "Withdrawal Failed",
        description: "Failed to withdraw collateral. Ensure no active debt.",
        variant: "destructive",
      })
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
            <Button
              onClick={connectWallet}
              disabled={isLoading}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
            >
              <Wallet className="mr-2 h-5 w-5" />
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-cyan-500 text-cyan-400 px-4 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                {account.slice(0, 6)}...{account.slice(-4)}
              </Badge>
              <Button
                onClick={loadUserData}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {account && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Portfolio Overview */}
            <Card className="lg:col-span-3 bg-slate-900/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  Portfolio Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                    <p className="text-2xl font-bold text-orange-400">
                      {Number.parseFloat(interestAccrued).toFixed(4)}
                    </p>
                    <p className="text-slate-500 text-xs">dDAI</p>
                  </div>
                </div>

                <Separator className="my-6 bg-slate-700" />

                <div className="flex justify-center">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm mb-1">Collateralization Ratio</p>
                    <p className="text-3xl font-bold text-green-400">{calculateCollateralizationRatio()}%</p>
                    <p className="text-slate-500 text-xs">Minimum: 150%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deposit Collateral */}
            <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <ArrowDownCircle className="h-5 w-5 text-cyan-400" />
                  Deposit Collateral
                </CardTitle>
                <CardDescription className="text-slate-400">Deposit cUSD tokens as collateral</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deposit" className="text-slate-300">
                    Amount (cUSD)
                  </Label>
                  <Input
                    id="deposit"
                    type="number"
                    placeholder="0.00"
                    value={depositInput}
                    onChange={(e) => setDepositInput(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500"
                  />
                </div>
                <Button
                  onClick={deposit}
                  disabled={!depositInput || isLoading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                >
                  {isLoading ? "Processing..." : "Deposit Collateral"}
                </Button>
              </CardContent>
            </Card>

            {/* Borrow */}
            <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5 text-purple-400" />
                  Borrow
                </CardTitle>
                <CardDescription className="text-slate-400">Borrow dDAI against your collateral</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="borrow" className="text-slate-300">
                    Amount (dDAI)
                  </Label>
                  <Input
                    id="borrow"
                    type="number"
                    placeholder="0.00"
                    value={borrowInput}
                    onChange={(e) => setBorrowInput(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Max: {getMaxBorrowAmount()} dDAI</p>
                </div>
                <Button
                  onClick={borrow}
                  disabled={!borrowInput || isLoading || Number.parseFloat(collateralAmount) === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isLoading ? "Processing..." : "Borrow"}
                </Button>
              </CardContent>
            </Card>

            {/* Repay & Withdraw */}
            <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-100">Manage Position</CardTitle>
                <CardDescription className="text-slate-400">Repay loans and withdraw collateral</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={repay}
                  disabled={isLoading || Number.parseFloat(debtAmount) === 0}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  {isLoading
                    ? "Processing..."
                    : `Repay Loan (${(Number.parseFloat(debtAmount) + Number.parseFloat(interestAccrued)).toFixed(4)} dDAI)`}
                </Button>
                <Button
                  onClick={withdraw}
                  disabled={isLoading || Number.parseFloat(debtAmount) > 0 || Number.parseFloat(collateralAmount) === 0}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  {isLoading ? "Processing..." : "Withdraw Collateral"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Protocol Info */}
        <Card className="mt-8 bg-slate-900/30 border-slate-700 backdrop-blur-sm">
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
