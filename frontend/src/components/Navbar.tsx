"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, GraduationCap, User, LayoutDashboard, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();

    const navLinks = [
        { name: "Início", href: "/" },
        { name: "Concursos", href: "/exams" },
        { name: "Questões", href: "/study/questions" },
        { name: "Flashcards", href: "/study/flashcards" },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-primary p-1.5 rounded-lg group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                        <GraduationCap className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-black tracking-tighter italic uppercase">Sou Concursado</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.name} 
                            href={link.href}
                            className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors tracking-tight"
                        >
                            {link.name}
                        </Link>
                    ))}
                    
                    {user ? (
                        <div className="flex items-center gap-4 border-l pl-8">
                            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-all">
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                            <button 
                                onClick={logout}
                                className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-red-500 transition-all"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <Link href="/login">
                            <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-black uppercase italic tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-xl shadow-primary/20">
                                <User className="h-4 w-4" />
                                Entrar
                            </button>
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button 
                    className="md:hidden p-2 text-muted-foreground"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-b bg-background overflow-hidden"
                    >
                        <div className="flex flex-col p-6 gap-4">
                            {navLinks.map((link) => (
                                <Link 
                                    key={link.name} 
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="text-base font-bold italic uppercase tracking-tighter px-4 py-3 hover:bg-muted rounded-2xl"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="border-t pt-4 mt-2">
                                {user ? (
                                    <div className="space-y-3">
                                        <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                                            <button className="w-full bg-primary text-primary-foreground px-4 py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/20">
                                                <LayoutDashboard className="h-4 w-4" />
                                                Meu Dashboard
                                            </button>
                                        </Link>
                                        <button 
                                            onClick={() => { logout(); setIsOpen(false); }}
                                            className="w-full bg-muted text-muted-foreground px-4 py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest flex items-center justify-center gap-2"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sair da Conta
                                        </button>
                                    </div>
                                ) : (
                                    <Link href="/login" onClick={() => setIsOpen(false)}>
                                        <button className="w-full bg-primary text-primary-foreground px-4 py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest flex items-center justify-center gap-2">
                                            <User className="h-4 w-4" />
                                            Entrar
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
