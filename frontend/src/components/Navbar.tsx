"use client";

/**
 * Navigation bar with authentication state.
 */

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Home, Search, Code, FileText, Users, LogIn, LogOut, Shield, User, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "SPARQL", href: "/sparql", icon: Code },
  { name: "Report Incidents", href: "/reports", icon: FileText },
  { name: "About Us", href: "/about", icon: Users },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, isLoading, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 font-bold text-2xl text-indigo-600">
            Exhibitium
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className="text-sm font-semibold leading-6 text-gray-900 hover:text-indigo-600 flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
          {isAuthenticated && (
            <Link href="/insert" className="text-sm font-semibold leading-6 text-emerald-600 hover:text-emerald-800 flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Insert Data
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/users" className="text-sm font-semibold leading-6 text-purple-600 hover:text-purple-800 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-4">
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.username?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                </div>
                <span className="font-medium">{user?.full_name || user?.username}</span>
                {isAdmin && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>
                )}
              </div>
              <button
                onClick={logout}
                className="text-sm font-semibold leading-6 text-gray-600 hover:text-red-600 flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/auth/register" className="text-sm font-semibold leading-6 text-gray-600 hover:text-indigo-600">
                Register
              </Link>
              <Link 
                href="/auth/login" 
                className="text-sm font-semibold leading-6 text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Log in
              </Link>
            </div>
          )}
        </div>
      </nav>
      
      {/* Mobile menu */}
      <div className={cn("lg:hidden", mobileMenuOpen ? "fixed inset-0 z-50" : "hidden")}>
        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5 font-bold text-xl text-indigo-600">
              Exhibitium
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              {/* User info for mobile */}
              {isAuthenticated && (
                <div className="py-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                    {user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user?.full_name || user?.username}</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                </div>
              )}

              {/* Navigation links */}
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-5 w-5 text-gray-400" />
                      {item.name}
                    </div>
                  </Link>
                ))}
                {isAuthenticated && (
                  <Link
                    href="/insert"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      <PlusCircle className="h-5 w-5" />
                      Insert Data
                    </div>
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin/users"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-purple-600 hover:bg-purple-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Admin Panel
                    </div>
                  </Link>
                )}
              </div>

              {/* Auth buttons for mobile */}
              <div className="py-6">
                {isAuthenticated ? (
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="h-5 w-5" />
                      Log out
                    </div>
                  </button>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/auth/register"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-indigo-600 hover:bg-indigo-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Create account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
