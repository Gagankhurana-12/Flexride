import React from 'react';
import { Star } from 'lucide-react';

export default function RatingStars({ rating, totalStars = 5, size = 'sm', showNumber = true, interactive = false, onRatingChange }) {
  const safeRating = Number(rating || 0);
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleStarClick = (starRating) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center">
        {[...Array(totalStars)].map((_, index) => {
          const starRating = index + 1;
          const isFilled = starRating <= safeRating;
          const isHalfFilled = starRating - 0.5 <= safeRating && starRating > safeRating;

          return (
            <button
              key={`star-${index}`}
              onClick={() => handleStarClick(starRating)}
              disabled={!interactive}
              className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform duration-150`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled || isHalfFilled
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
          {safeRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}