
// src/app/admin/categories/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, Loader2, ListChecks } from 'lucide-react';
import type { SupabaseCategory } from '@/types';
import { CategoryForm, type CategoryFormSubmitData } from './components/CategoryForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<SupabaseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SupabaseCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch categories' }));
        throw new Error(errorData.error);
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Fetch categories error:", error);
      toast({ title: "Error Fetching Categories", description: (error as Error).message, variant: "destructive" });
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: SupabaseCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!window.confirm("Are you sure you want to delete this category? This action might fail if products are associated with it.")) {
      return;
    }
    
    setIsSubmitting(true);
    const loadingToastId = toast({ title: "Deleting category...", description: "Please wait.", duration: Infinity }).id;
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete category' }));
        throw new Error(errorData.error);
      }
      
      await fetchCategories(); 
      toast({ title: "Category Deleted", description: `Category has been removed.` });
    } catch (error) {
      console.error("Delete category error:", error);
      toast({ title: "Error Deleting Category", description: (error as Error).message, variant: "destructive" });
    } finally {
      if(loadingToastId) toast.dismiss(loadingToastId);
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (data: CategoryFormSubmitData) => {
    setIsSubmitting(true);
    const isUpdating = !!data.id;
    const actionVerb = isUpdating ? "Updating" : "Adding";
    const loadingToastId = toast({ title: `${actionVerb} category...`, description: "Please wait.", duration: Infinity }).id;

    try {
      const url = isUpdating ? `/api/categories/${data.id}` : '/api/categories';
      const method = isUpdating ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, description: data.description }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server error during category ${actionVerb.toLowerCase()}` }));
        throw new Error(errorData.error);
      }
      
      const result = await response.json();
      if (result.success) {
        toast({ title: `Category ${isUpdating ? 'Updated' : 'Added'}`, description: `${data.name} has been successfully ${isUpdating ? 'updated' : 'added'}.` });
        await fetchCategories(); 
        setIsFormOpen(false); 
        setEditingCategory(null);
      } else {
        throw new Error(result.error || `Unknown API error after ${actionVerb.toLowerCase()} category.`);
      }
    } catch (error) {
      console.error(`Category ${actionVerb.toLowerCase()} error:`, error);
      toast({ title: `Category ${isUpdating ? 'Update' : 'Add'} Failed`, description: (error as Error).message, variant: "destructive" });
    } finally {
      if(loadingToastId) toast.dismiss(loadingToastId);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Category Management</h1>
          <p className="text-muted-foreground">Add, edit, or remove product categories.</p>
        </div>
        <Button onClick={handleAddCategory} size="lg" disabled={isSubmitting || isLoading}>
          {isLoading && !categories.length && !isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />} 
          Add New Category
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>A list of all product categories.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length > 0 ? categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.id}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{category.description || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {category.created_at ? format(new Date(category.created_at), 'PPpp') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditCategory(category)} title="Edit Category" disabled={isSubmitting}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteCategory(category.id)} title="Delete Category" disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No categories found. Click 'Add New Category' to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        if (isSubmitting) return; 
        setIsFormOpen(isOpen);
        if (!isOpen) setEditingCategory(null);
      }}>
        <DialogContent className="sm:max-w-lg p-0">
          {isFormOpen && ( // Conditionally render Form to reset state on close/reopen
            <CategoryForm
              category={editingCategory}
              onSubmit={handleFormSubmit}
              onCancel={() => { setIsFormOpen(false); setEditingCategory(null); }}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
      <p className="text-sm text-muted-foreground text-center">
        Category management interacts with API endpoints. Ensure Supabase RLS policies allow these operations for admins.
      </p>
    </div>
  );
}
