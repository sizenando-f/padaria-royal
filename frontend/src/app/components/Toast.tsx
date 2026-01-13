import { AlertCircle, CheckCircle, X } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

export default function Toast({message, type, onClose}: ToastProps){
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
                type === 'success'
                ? 'bg-white text-green-800 border-green-100'
                : 'bg-white text-red-800 border-red-100'
            }`}>
                {type === 'success' ? (
                    <div className="bg-green-100 p-2 rounded-full text-green-600">
                        <CheckCircle size={24} strokeWidth={3} />
                    </div>
                ) : (
                    <div className="bg-red-100 p-2 rounded-full text-red-600">
                        <AlertCircle size={24} strokeWidth={3} />
                    </div>
                )}

                <div className="flex flex-col">
                    <span className={`text-sm font-bold ${type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                        {type === 'success' ? 'Sucesso!' : 'Atenção'}
                    </span>
                    <span className="text-sm font-medium text-gray-600">{message}</span>
                </div>

                <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
                    <X size={18} />
                </button>
            </div>
        </div>
    )
}