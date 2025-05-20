import React from 'react';
import MobileLayout from '@/components/mobile/layout';
import PartCard from '@/components/mobile/part-card';
import { useQuery } from '@tanstack/react-query';
import { Parts } from '@/types/parts';
import { Favorites } from '@/types/favorites';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const FavoritesPage = () => {
  const { user } = useAuth();
  
  // Get all favorites for the current user
  const { 
    data: favorites, 
    isLoading: isLoadingFavorites,
    error: favoritesError 
  } = useQuery<Favorites[]>({
    queryKey: ['/api/favorites'],
    enabled: !!user
  });

  // Get all parts to match with favorites
  const { 
    data: parts, 
    isLoading: isLoadingParts,
    error: partsError 
  } = useQuery<Parts[]>({
    queryKey: ['/api/parts'],
    enabled: !!favorites && favorites.length > 0
  });

  // Filter parts to only show favorited parts
  const favoritedParts = React.useMemo(() => {
    if (!parts || !favorites) return [];
    
    const favoritePartIds = favorites.map(fav => fav.partId);
    return parts.filter(part => favoritePartIds.includes(part.id));
  }, [parts, favorites]);

  const isLoading = isLoadingFavorites || isLoadingParts;
  const error = favoritesError || partsError;

  if (isLoading) {
    return (
      <MobileLayout title="My Favorites">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout title="My Favorites">
        <div className="p-4 text-center">
          <p className="text-red-500 mb-4">Error loading favorites: {error.message}</p>
          <Button asChild>
            <Link href="/mobile/parts">Back to Parts</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="My Favorites">
      <div className="p-4">
        {(!favorites || favorites.length === 0) ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">You haven't added any favorites yet.</p>
            <Button asChild>
              <Link href="/mobile/parts">Browse Parts</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Your Favorite Items ({favoritedParts.length})</h2>
              <p className="text-sm text-muted-foreground">
                Here are the parts you've marked as favorites
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {favoritedParts.map((part) => (
                <PartCard key={part.id} part={part} />
              ))}
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
};

export default FavoritesPage;