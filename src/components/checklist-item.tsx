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
import { Camera, FileImage } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Button } from "./ui/button";

type Status = "BAIK" | "RUSAK" | "PERLU PERHATIAN";

type ChecklistItemProps = {
  label: string;
};

export function ChecklistItem({ label }: ChecklistItemProps) {
  const [status, setStatus] = useState<Status>("BAIK");
  const showDetails = status === "RUSAK" || status === "PERLU PERHATIAN";
  const [isOpen, setIsOpen] = useState(false);
  const [imageName, setImageName] = useState("");

  const handleStatusChange = (newStatus: Status) => {
    setStatus(newStatus);
    setIsOpen(newStatus === "RUSAK" || newStatus === "PERLU PERHATIAN");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setImageName(event.target.files[0].name);
    } else {
      setImageName("");
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
          
          <CollapsibleTrigger asChild>
            <button className="hidden">Toggle</button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 pt-4 animate-accordion-down">
            <Textarea
              placeholder="Tuliskan keterangan kerusakan..."
              className="mt-4"
            />
            <div className="relative">
              <Input type="file" id={`file-${label}`} className="pr-10" accept="image/*" onChange={handleFileChange} />
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
  const [imageName, setImageName] = useState("");
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setImageName(event.target.files[0].name);
    } else {
      setImageName("");
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
        <Textarea placeholder="Tuliskan keterangan kerusakan lainnya..." />
        <div className="relative">
          <Input type="file" id="file-other" className="pr-10" accept="image/*" onChange={handleFileChange} />
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
