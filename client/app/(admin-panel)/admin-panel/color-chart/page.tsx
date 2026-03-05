"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL; // 👈 Use backend API

export default function ColorChartAdmin() {
  const [url, setUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const fetchColorChart = async () => {
    const res = await fetch(`${API}/color-chart`, { cache: "no-store" });
    const data = await res.json();
    setUrl(data.imageUrl || null);
  };

  useEffect(() => {
    fetchColorChart();
  }, []);

  const uploadHandler = async () => {
    if (!file) return toast.error("Please select image!");

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${API}/color-chart/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      toast.success("Color chart updated!");
      fetchColorChart();
      setFile(null);
    } else {
      toast.error(data.message || "Upload failed!");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Color Chart Manager</h1>

      {url && (
       <Image
  src={url}
  alt="Color Chart"
  width={1200}
  height={800}
  className="w-full max-w-[600px] h-auto object-contain rounded border"
  unoptimized
/>

      )}

      <Input
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) setFile(e.target.files[0]);
        }}
      />

      <Button onClick={uploadHandler}>Upload</Button>
    </div>
  );
}
