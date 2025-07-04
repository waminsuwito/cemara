
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOperatorAuth } from "@/context/operator-auth-context";
import { useAppData } from "@/context/app-data-context";

const feedbackFormSchema = z.object({
  message: z.string().min(10, { message: "Mohon isi pesan minimal 10 karakter." }),
});

type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

export default function ComplaintPage() {
    const { user: operator, vehicle: vehicleHullNumber } = useOperatorAuth();
    const { addComplaint } = useAppData();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    
    const form = useForm<FeedbackFormData>({
        resolver: zodResolver(feedbackFormSchema),
        defaultValues: { message: "" },
    });

    const onSubmit = async (data: FeedbackFormData) => {
        setIsLoading(true);
        if (!operator || !vehicleHullNumber || !operator.location) {
            toast({ variant: "destructive", title: "Error", description: "Sesi tidak valid. Silakan login ulang." });
            setIsLoading(false);
            return;
        }

        try {
            await addComplaint({
                operatorName: operator.name,
                vehicleId: vehicleHullNumber,
                location: operator.location,
                complaint: data.message,
            });
            form.reset();
        } catch (error) {
            // Error is already handled by the context
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
      <Card>
          <CardHeader>
              <CardTitle>Formulir Komplain</CardTitle>
              <CardDescription>Sampaikan komplain atau masalah teknis yang Anda hadapi. Tim mekanik akan segera menindaklanjuti.</CardDescription>
          </CardHeader>
          <CardContent>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                              <FormItem>
                                  <Textarea {...field} rows={5} placeholder="Contoh: Rem terasa kurang pakem saat turunan, mohon diperiksa segera." />
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <Button type="submit" disabled={isLoading}>
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Kirim Komplain
                      </Button>
                  </form>
              </Form>
          </CardContent>
      </Card>
    );
};
