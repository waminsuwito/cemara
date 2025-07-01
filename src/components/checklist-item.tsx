
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Camera } from "lucide-react";
import { Collapsible, CollapsibleContent } from "./ui/collapsible";
import { Button } from "./ui/button";
import { useFormContext, Controller } from "react-hook-form";

type Status = "BAIK" | "RUSAK" | "PERLU PERHATIAN";

type ChecklistItemProps = {
  label: string;
  index: number;
};

export function ChecklistItem({ label, index }: ChecklistItemProps) {
  const { control, watch, setValue } = useFormContext();
  const status: Status = watch(`items.${index}.status`);
  const [isOpen, setIsOpen] = useState(status !== "BAIK");
  const [imageName, setImageName] = useState("");

  const handleStatusChange = (newStatus: Status) => {
    setValue(`items.${index}.status`, newStatus, { shouldValidate: true });
    setIsOpen(newStatus !== "BAIK");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setImageName(file.name);
      setValue(`items.${index}.foto`, file, { shouldValidate: true });
    } else {
      setImageName("");
      setValue(`items.${index}.foto`, undefined, { shouldValidate: true });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">{label}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-between">
          <RadioGroup
            value={status}
            onValueChange={(value) => handleStatusChange(value as Status)}
            className="flex items-center space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="BAIK" id={`${label}-baik`} />
              <Label htmlFor={`${label}-baik`}>BAIK</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="RUSAK" id={`${label}-rusak`} />
              <Label htmlFor={`${label}-rusak`}>RUSAK</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PERLU PERHATIAN" id={`${label}-perhatian`} />
              <Label htmlFor={`${label}-perhatian`}>PERHATIAN</Label>
            </div>
          </RadioGroup>
          
          <CollapsibleContent className="space-y-4 pt-4 animate-accordion-down">
            <Controller
              name={`items.${index}.keterangan`}
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Tuliskan keterangan kerusakan..."
                  className="mt-4"
                />
              )}
            />
            <div className="relative">
              <Input type="file" id={`file-${label}`} className="pr-10" accept="image/*" capture="environment" onChange={handleFileChange} />
               <Label htmlFor={`file-${label}`} className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                  <div>
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">Upload Image</span>
                  </div>
                </Button>
              </Label>
            </div>
            {imageName && <p className="text-sm text-muted-foreground">File: {imageName}</p>}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

export function OtherDamageItem() {
  const { control, setValue } = useFormContext();
  const [imageName, setImageName] = useState("");
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setImageName(file.name);
      setValue('kerusakanLain.foto', file, { shouldValidate: true });
    } else {
      setImageName("");
      setValue('kerusakanLain.foto', undefined, { shouldValidate: true });
    }
  };

  return (
    <Card className="md:col-span-2 lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-base">Kerusakan Lainnya</CardTitle>
        <CardDescription>
          Detailkan kerusakan lain yang tidak ada di daftar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Controller
          name="kerusakanLain.keterangan"
          control={control}
          render={({ field }) => (
            <Textarea {...field} placeholder="Tuliskan keterangan kerusakan lainnya..." />
          )}
        />
        <div className="relative">
          <Input type="file" id="file-other" className="pr-10" accept="image/*" capture="environment" onChange={handleFileChange} />
          <Label htmlFor="file-other" className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <div>
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Upload Image</span>
              </div>
            </Button>
          </Label>
        </div>
        {imageName && <p className="text-sm text-muted-foreground">File: {imageName}</p>}
      </CardContent>
    </Card>
  );
}
