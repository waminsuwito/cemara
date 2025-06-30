
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChecklistItem, OtherDamageItem } from "@/components/checklist-item";
import { Header } from "@/components/header";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { checklistItems } from "@/lib/data";

export default function ChecklistPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // In a real app, you would collect data from all child components
    // and send it to the server.
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Laporan Terkirim",
        description: "Checklist harian Anda telah berhasil dikirim.",
      });
      router.push("/");
    }, 1500);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold md:text-3xl font-headline">
            Daily Checklist Kendaraan
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {checklistItems.map((item) => (
              <ChecklistItem key={item.id} label={item.label} />
            ))}
            <OtherDamageItem />
          </div>

          <div className="flex justify-end">
            <Button size="lg" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kirim Laporan
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
