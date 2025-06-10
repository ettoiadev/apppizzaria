"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  ShoppingBag,
  Menu,
  X,
  User,
  ChevronDown,
  UtensilsCrossed,
  Package,
  UserCircle,
  Ticket,
  Heart,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AuthenticatedHeaderProps {
  onCartClick?: () => void
}

export function AuthenticatedHeader({ onCartClick }: AuthenticatedHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { itemCount, total } = useCart()
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick()
    } else {
      router.push("/checkout")
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const navigationItems = [
    { href: "/menu", label: "Cardápio", icon: UtensilsCrossed },
    { href: "/pedidos", label: "Pedidos", icon: Package },
    { href: "/conta", label: "Dados da Conta", icon: UserCircle },
    { href: "/cupons", label: "Cupons", icon: Ticket },
    { href: "/favoritos", label: "Favoritos", icon: Heart },
    { href: "/seguranca", label: "Segurança", icon: Shield },
  ]

  // Get shortened name (first name only)
  const getShortName = (fullName: string) => {
    return fullName.split(" ")[0]
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/menu" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">PE</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Pizza Express</span>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart Button */}
            <Button
              variant="ghost"
              onClick={handleCartClick}
              className="flex flex-col items-center p-2 h-auto min-w-[80px] hover:bg-gray-50"
            >
              <div className="flex items-center space-x-1">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-gray-900">R$ {total.toFixed(2)}</span>
              </div>
              <span className="text-xs text-gray-500">
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </span>
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium text-gray-900">
                    Olá, {user?.name ? getShortName(user.name) : "Usuário"}
                  </p>
                </div>
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={`flex items-center space-x-3 px-3 py-2 ${
                          pathname === item.href ? "bg-primary/10 text-primary" : ""
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 px-3 py-2">
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Mobile Cart Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCartClick}
              className="flex flex-col items-center p-1 h-auto min-w-[60px]"
            >
              <div className="flex items-center space-x-1">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-gray-900">R$ {total.toFixed(2)}</span>
              </div>
              <span className="text-xs text-gray-500">
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </span>
            </Button>

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Slide Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-black bg-opacity-50 z-40">
            <div className="bg-white w-80 max-w-[85vw] h-full shadow-lg animate-in slide-in-from-right">
              <nav className="py-4">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Olá, {user?.name ? getShortName(user.name) : "Usuário"}
                      </p>
                      <p className="text-xs text-gray-500">Bem-vindo de volta!</p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors ${
                          pathname === item.href ? "bg-primary/10 text-primary border-r-2 border-primary" : ""
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>

                <div className="border-t mt-2 pt-2">
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full text-left font-medium"
                  >
                    <span>Sair</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
