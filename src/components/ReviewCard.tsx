import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import RatingStars from "./RatingStars";
import { formatDistanceToNow } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";

interface ReviewCardProps {
  reviewId: string;
  reviewerName: string;
  reviewerUserId: string;
  rating: number;
  reviewText?: string;
  createdAt: string;
  currentUserId?: string;
  onEdit?: (reviewId: string, rating: number, reviewText?: string) => void;
  onDelete?: (reviewId: string) => void;
}

const ReviewCard = ({ 
  reviewId,
  reviewerName, 
  reviewerUserId,
  rating, 
  reviewText, 
  createdAt,
  currentUserId,
  onEdit,
  onDelete
}: ReviewCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isOwnReview = currentUserId === reviewerUserId;

  const handleDelete = () => {
    onDelete?.(reviewId);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold">{reviewerName}</h4>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RatingStars rating={rating} showNumber={false} />
              {isOwnReview && (
                <div className="flex gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit?.(reviewId, rating, reviewText)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          {reviewText && (
            <p className="text-sm text-muted-foreground mt-2">{reviewText}</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ReviewCard;