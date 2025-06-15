
// src/components/ReviewsSection.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2 } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string; // or number, depending on your DB schema
  author: string;
  avatarUrl?: string | null;
  rating: number;
  date: string;
  comment: string;
}

const StarRatingDisplay = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );
};

const StarRatingInput = ({ rating, setRating, disabled }: { rating: number, setRating: (rating: number) => void, disabled?: boolean }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && setRating(star)}
          className={`p-1 ${!disabled ? 'cursor-pointer' : 'cursor-default'}`}
          aria-label={`Rate ${star} stars`}
          disabled={disabled}
        >
          <Star
            className={`h-5 w-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(0);

  const { authUser } = useAppContext();
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setIsLoadingReviews(true);
    try {
      const response = await fetch(`/api/reviews?product_id=${productId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch reviews."}));
        throw new Error(errorData.message);
      }
      const data: Review[] = await response.json();
      setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      setReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [productId, toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      toast({ title: "Authentication Required", description: "Please log in to submit a review.", variant: "destructive" });
      return;
    }
    if (!newReviewText.trim() || newReviewRating === 0) {
        toast({ title: "Missing Information", description: "Please provide a rating and a comment.", variant: "destructive" });
        return;
    }

    setIsSubmittingReview(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          rating: newReviewRating,
          comment: newReviewText,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit review.');
      }
      
      toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
      setNewReviewText('');
      setNewReviewRating(0);
      if (result.review) { // Optimistically add or refetch
        setReviews(prevReviews => [result.review, ...prevReviews]); // Add new review to top
      } else {
        fetchReviews(); // Fallback to refetch all
      }

    } catch (error) {
      console.error("Error submitting review:", error);
      toast({ title: "Submission Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  return (
    <section id="reviews" className="py-12 md:py-16 bg-secondary/30 dark:bg-background">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-2 text-foreground">Customer Reviews & Ratings</h2>
        {isLoadingReviews ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : reviews.length > 0 ? (
            <div className="flex items-center justify-center mb-8 gap-2">
                <StarRatingDisplay rating={averageRating} />
                <p className="text-muted-foreground">({averageRating.toFixed(1)} average from {reviews.length} review{reviews.length === 1 ? '' : 's'})</p>
            </div>
        ) : (
            !isLoadingReviews && <p className="text-muted-foreground text-center py-4">No reviews yet for this product.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Review Form */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Leave a Review</CardTitle>
                <CardDescription>Share your thoughts about this product.</CardDescription>
              </CardHeader>
              {authUser ? (
                <form onSubmit={handleSubmitReview}>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label>Your Rating <span className="text-destructive">*</span></Label>
                      <StarRatingInput rating={newReviewRating} setRating={setNewReviewRating} disabled={isSubmittingReview} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="review-text">Your Review <span className="text-destructive">*</span></Label>
                      <Textarea
                        id="review-text"
                        value={newReviewText}
                        onChange={(e) => setNewReviewText(e.target.value)}
                        placeholder="What did you like or dislike?"
                        rows={4}
                        required
                        disabled={isSubmittingReview}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmittingReview || !newReviewText.trim() || newReviewRating === 0}>
                      {isSubmittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Review
                    </Button>
                  </CardContent>
                </form>
              ) : (
                <CardContent>
                  <p className="text-muted-foreground">Please <a href="/signin" className="text-primary underline">sign in</a> to leave a review.</p>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Reviews List */}
          <div className="md:col-span-2 space-y-6">
            {reviews.length === 0 && !isLoadingReviews ? (
              <p className="text-muted-foreground text-center md:text-left py-8">Be the first to review this product!</p>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={review.avatarUrl || `https://placehold.co/40x40.png?text=${review.author.substring(0,1)}`} alt={review.author} data-ai-hint="person avatar" />
                        <AvatarFallback>{review.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{review.author}</h4>
                          <span className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString()}</span>
                        </div>
                        <StarRatingDisplay rating={review.rating} />
                        <p className="mt-2 text-sm text-foreground/90">{review.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
