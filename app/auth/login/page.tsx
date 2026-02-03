"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, Eye, EyeOff, LogIn, Chrome } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth, googleProvider } from "@/lib/firebase"
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.push("/notes")
      }
    })
    return unsubscribe
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/notes")
    } catch (err: any) {
      setError(err.message || "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError("")

    try {
      await signInWithPopup(auth, googleProvider)
      router.push("/notes")
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google")
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background animations */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 45,
            repeat: Number.POSITIVE_INFINITY,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-orange-300/6 to-amber-400/6 rounded-full blur-3xl will-change-transform"
        />
        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, 18, 0],
          }}
          transition={{
            duration: 55,
            repeat: Number.POSITIVE_INFINITY,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="absolute top-1/2 right-32 w-80 h-80 bg-gradient-to-br from-amber-400/8 to-orange-500/8 rounded-full blur-3xl will-change-transform"
        />
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 65,
            repeat: Number.POSITIVE_INFINITY,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="absolute bottom-32 left-1/3 w-72 h-72 bg-gradient-to-br from-yellow-300/4 to-orange-300/6 rounded-full blur-3xl will-change-transform"
        />
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="w-full max-w-md"
        >
          <Card className="glass-card border-0 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mb-4"
              >
                <LogIn className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl font-bold text-slate-800">Welcome Back</CardTitle>
              <CardDescription className="text-slate-600">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-slate-200 focus:border-orange-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 border-slate-200 focus:border-orange-400 transition-colors"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1 h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <Alert className="border-red-200 bg-red-50/50">
                      <AlertDescription className="text-red-700 text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="pt-2"
                >
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl py-3 font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">Or continue with</span>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  variant="outline"
                  className="w-full border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl py-3 font-medium transition-all duration-300"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting to Google...
                    </>
                  ) : (
                    <>
                      <Chrome className="w-4 h-4 mr-2" />
                      Continue with Google
                    </>
                  )}
                </Button>
              </motion.div>

              <div className="mt-6 text-center">
                <p className="text-slate-600 text-sm">
                  Don't have an account?{" "}
                  <Link
                    href="/auth/signup"
                    className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
