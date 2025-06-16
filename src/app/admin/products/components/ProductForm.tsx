// src/app/admin/products/components/ProductForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import type { Product } from "@/types";
import { useState, useEffect } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export interface ProductFormSubmitData {
  id?: string; // Present if editing an existing product
  name: string;
  description: string;
  price: string; // Will be parsed to float by backend
  stock: string; // Will be parsed to int by backend
  category_id: number | null; // Changed from category string to category_id number
  imageFile: File | null;
  currentImageUrl?: string; // URL of existing image if editing
 'data-ai-hint'?: string;
}

interface ProductFormProps {
  product?: Product | null; // Product data if editing
  onSubmit: (data: ProductFormSubmitData) => void;
  onCancel: () => void;
  availableCategories: { value: number; label: string }[];
  isSubmitting?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, availableCategories, isSubmitting }: ProductFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(''); // Store as string for Select component
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dataAiHint, setDataAiHint] = useState<string>('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setPrice(product.price.toString());
      // @ts-ignore - product may not have stock property yet if data source is old
      setStock(product.stock?.toString() || '0');
      setSelectedCategoryId(product.category_id ? product.category_id.toString() : ''); // Use product.category_id
      setImagePreview(product.image);
      setDataAiHint(product['data-ai-hint'] || product.name.toLowerCase().split(' ')[0] || 'product');
    } else {
      // Reset form for new product
      setName('');
      setDescription('');
      setPrice('');
      setStock('0');
      setSelectedCategoryId('');
      setImageFile(null);
      setImagePreview(null);
      setDataAiHint('');
    }
  }, [product]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Image Too Large", description: "Please select an image smaller than 2MB.", variant: "destructive" });
        e.target.value = "";
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmitInternal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCategoryId) {
        toast({ title: "Category Required", description: "Please select a category for the product.", variant: "destructive" });
        return;
    }
    if (!name.trim()) {
        toast({ title: "Name Required", description: "Please enter a product name.", variant: "destructive" });
        return;
    }
     if (!price.trim() || parseFloat(price) <= 0) {
        toast({ title: "Valid Price Required", description: "Please enter a price greater than 0.", variant: "destructive" });
        return;
    }
    if (!stock.trim() || parseInt(stock) < 0) {
        toast({ title: "Valid Stock Required", description: "Please enter a stock quantity of 0 or more.", variant: "destructive" });
        return;
    }
    if (!product?.id && !imageFile) { // New product requires an image
        toast({ title: "Image Required", description: "Please upload an image for the new product.", variant: "destructive" });
        return;
    }

    onSubmit({
      id: product?.id,
      name,
      description,
      price,
      stock,
      category_id: parseInt(selectedCategoryId, 10), // Convert string ID back to number
      imageFile,
      currentImageUrl: product?.image,
      'data-ai-hint': dataAiHint || name.toLowerCase().split(' ')[0] || 'product',
    });
  };

  const isFormValid = name.trim() && price.trim() && parseFloat(price) > 0 && stock.trim() && parseInt(stock) >=0 && selectedCategoryId && (product?.id || imageFile);


  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-none">
      <CardHeader>
        <CardTitle>{product ? 'Edit Product' : 'Add New Product'}</CardTitle>
        <CardDescription>
          {product ? 'Update the details of the existing product.' : 'Fill in the details for the new product.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleFormSubmitInternal}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name <span className="text-destructive">*</span></Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) <span className="text-destructive">*</span></Label>
              <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required disabled={isSubmitting} min="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Qty <span className="text-destructive">*</span></Label>
              <Input id="stock" type="number" step="1" value={stock} onChange={(e) => setStock(e.target.value)} required disabled={isSubmitting} min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
              <Select
                value={selectedCategoryId}
                onValueChange={(value) => setSelectedCategoryId(value)}
                disabled={isSubmitting || availableCategories.length === 0}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder={availableCategories.length === 0 ? "Loading categories..." : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value.toString()}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="dataAiHint">AI Image Hint (1-2 words)</Label>
            <Input 
              id="dataAiHint" 
              value={dataAiHint} 
              onChange={(e) => setDataAiHint(e.target.value)} 
              placeholder="e.g. red apple, face cream, plush toy" 
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Helps generate relevant placeholder images if no image is uploaded. Max 2 words.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-upload">Product Image {!product?.id && <span className="text-destructive">*</span>}</Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="relative group mx-auto w-32 h-32">
                     <Image src={imagePreview} alt="Preview" layout="fill" objectFit="contain" className="rounded-md" />
                     <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 z-10"
                        onClick={() => {
                            setImageFile(null);
                            setImagePreview(product?.id ? product.image : null);
                            const fileInput = document.getElementById('image-upload') as HTMLInputElement;
                            if (fileInput) fileInput.value = "";
                        }}
                        disabled={isSubmitting}
                        title="Remove image"
                      >
                        <X className="h-4 w-4"/>
                      </Button>
                  </div>
                ) : (
                  <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                )}
                <div className="flex text-sm text-muted-foreground justify-center">
                  <label
                    htmlFor="image-upload"
                    className={`relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <span>{imagePreview ? 'Change file' : 'Upload a file'}</span>
                    <Input id="image-upload" name="image" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/gif" disabled={isSubmitting} />
                  </label>
                  {!imageFile && !imagePreview && <p className="pl-1">or drag and drop</p>}
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB</p>
              </div>
            </div>
            {product?.id && !imageFile && imagePreview && (
                 <p className="text-xs text-muted-foreground mt-1">
                    Currently using existing image. Upload a new file to replace it.
                 </p>
            )}
             <p className="text-xs text-muted-foreground mt-1">
               Ensure Supabase bucket 'product-images' and RLS policies allow uploads/updates for admins.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || !isFormValid}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? (product?.id ? 'Updating...' : 'Adding...') : (product?.id ? 'Update Product' : 'Add Product')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
