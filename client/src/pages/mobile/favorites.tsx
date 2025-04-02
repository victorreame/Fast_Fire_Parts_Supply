import { useState } from "react";
import MobileLayout from "@/components/mobile/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// This is a placeholder page as favorites functionality is not in the backend yet
// In a real implementation, this would connect to an API endpoint to get the user's favorite parts

const FavoritesPage = () => {
  // Placeholder state for favorites - would be replaced with API call
  const [favorites] = useState<any[]>([]);

  return (
    <MobileLayout title="Favorites" showBackButton={false}>
      <div className="p-4">
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {favorites.map((part) => (
              <Card key={part.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-start mt-2">
                        <Badge variant="outline" className="font-semibold bg-neutral-100 text-neutral-800 mr-2">
                          {part.itemCode}
                        </Badge>
                        <Badge variant="secondary" className="bg-primary-100 text-primary-800">
                          {part.pipeSize}
                        </Badge>
                      </div>
                      <h3 className="font-medium mt-1">{part.description}</h3>
                      <p className="text-sm text-neutral-500 mt-1">Type: {part.type}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <Button variant="ghost" size="icon" className="text-red-500">
                        <i className="fas fa-heart text-xl"></i>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-secondary mt-2">
                        <i className="fas fa-plus-circle text-xl"></i>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-180px)]">
            <i className="fas fa-heart text-4xl text-neutral-300 mb-4"></i>
            <h3 className="text-lg font-medium text-neutral-700 mb-2">No favorites yet</h3>
            <p className="text-neutral-500 text-center mb-6">
              Save your favorite parts for quick access
            </p>
            <Link href="/parts">
              <Button>Browse Parts</Button>
            </Link>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default FavoritesPage;
