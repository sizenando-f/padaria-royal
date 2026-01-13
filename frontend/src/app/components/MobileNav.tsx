'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home, ListCheck, PlusCircle } from "lucide-react";

export default function MobileNav(){
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 md:hidden z-50 pb-safe">
            <div className="flex justify-between items-center max-w-sm mx-auto">
                {/* Dashboard */}
                <Link href="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2}/>
                    <span className="text-[10px] font-medium">Início</span>
                </Link>

                {/* Botão de nova produção */}
                <Link href="/producao/novo" className="relative -top-5">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${isActive('/producao/novo') ?  'bg-orange-600 text-white ring-4 ring-orange-100' : 'bg-orange-500 text-white'}`}>
                        <PlusCircle size={28}/>
                    </div>
                </Link>

                {/* Histórico */}
                <Link href="/producao/historico" className={`flex flex-col items-center gap-1 ${isActive('/producao/historico') ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    <History size={24} strokeWidth={isActive('/producao/historico') ? 2.5 : 2}/>
                    <span className="text-[10px] font-medium">Histórico</span>
                </Link>

                {/* Avaliações pendentes */}
                <Link href="/avaliacao" className={`flex flex-col items-center gap-1 ${isActive('/avaliacao') ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    <ListCheck size={24} strokeWidth={isActive('/avaliacao') ? 2.5 : 2}/>
                    <span className="text-[10px] font-medium">Avaliar</span>
                </Link>
            </div>
        </div>
    )
}