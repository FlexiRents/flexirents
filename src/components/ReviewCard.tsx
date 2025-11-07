import { Card, CardContent } from "@/components/ui/card";
import RatingStars from "./RatingStars";
import { formatDistanceToNow } from "date-fns";

interface ReviewCardProps {
  reviewerName: string;
  rating: number;
  reviewText?: string;
  createdAt: string;
}

const ReviewCard = ({ reviewerName, rating, reviewText, createdAt }: ReviewCardProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-semibold">{reviewerName}</h4>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </p>
          </div>
          <RatingStars rating={rating} showNumber={false} />
        </div>
        {reviewText && (
          <p className="text-sm text-muted-foreground mt-2">{reviewText}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewCard;