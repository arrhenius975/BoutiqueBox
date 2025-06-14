
// src/app/admin/categories/components/CategoryForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import type { SupabaseCategory } from "@/types";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export interface CategoryFormSubmitData {
  id?: number;
  name: string;
  description: string;
}

interface CategoryFormProps {
  category?: SupabaseCategory | null;
  onSubmit: (data: CategoryFormSubmitData) => Promise<void>; // Make onSubmit async
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CategoryForm({ category, onSubmit, onCancel, isSubmitting }: CategoryFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [category]);

  const handleFormSubmitInternal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Name Required", description: "Please enter a category name.", variant: "destructive" });
      return;
    }
    await onSubmit({ // await the onSubmit call
      id: category?.id,
      name: name.trim(),
      description: description.trim(),
    });
  };
  
  const isFormValid = name.trim();

  return (
    <Card className="w-full max-w-lg mx-auto border-0 shadow-none">
      <CardHeader>
        <CardTitle>{category ? 'Edit Category' : 'Add New Category'}</CardTitle>
        <CardDescription>
          {category ? 'Update the details of the existing category.' : 'Fill in the details for the new category.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleFormSubmitInternal}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name <span className="text-destructive">*</span></Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting} rows={3} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || !isFormValid}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? (category?.id ? 'Updating...' : 'Adding...') : (category?.id ? 'Update Category' : 'Add Category')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
