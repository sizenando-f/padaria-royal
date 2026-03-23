"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }){
    const [queryclient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 2,
                retry: 1,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryclient}>
            {children}
        </QueryClientProvider>
    );
}