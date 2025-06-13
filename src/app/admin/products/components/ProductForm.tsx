
// src/app/admin/products/components/ProductForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Product, ProductCategory } from "@/types"; // Assuming ProductCategory is defined
import { useState, useEffect } from "react";
import { UploadCloud, X } from "lucide-react";
import Image from 'next/image';

interface ProductFormProps {
  product?: Product | null; // Product data for editing, null for new product
  onSubmit: (formData: FormData) => void; // Using FormData for file upload
  onCancel: () => void;
  availableCategories: { value: ProductCategory; label: string }[]; // Pass available categories
}

export function ProductForm({ product, onSubmit, onCancel, availableCategories }: ProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setPrice(product.price.toString());
      setCategory(product.category);
      setImagePreview(product.image); // Display existing image
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setImageFile(null);
      setImagePreview(null);
    }
  }, [product]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('category', category);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    // If updating and no new image is selected, backend should keep old image
    // This client-side form doesn't send the old image URL directly for security/simplicity
    // Backend needs to handle "no image file means keep existing" for updates.
    
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{product ? 'Edit Product' : 'Add New Product'}</CardTitle>
        <CardDescription>
          {product ? 'Update the details of the existing product.' : 'Fill in the details for the new product.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as ProductCategory)} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Product Image</Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="relative group">
                     <Image src={imagePreview} alt="Preview" width={200} height={200} className="mx-auto h-32 w-32 object-contain rounded-md" />
                     <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                        onClick={() => { setImageFile(null); setImagePreview(null); if(product) product.image = '';}}
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
                    className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                  >
                    <span>Upload a file</span>
                    <Input id="image-upload" name="image" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Important: Image upload functionality requires backend implementation. This is a UI placeholder.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">{product ? 'Update Product' : 'Add Product'}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
