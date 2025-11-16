"use client";

import { WalletProvider } from "@/contexts/WalletContext";
import { DocumentProvider } from "@/contexts/DocumentContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <DocumentProvider>{children}</DocumentProvider>
    </WalletProvider>
  );
}
