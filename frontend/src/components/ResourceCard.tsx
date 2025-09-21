
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Video } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface ResourceCardProps {
  id?: string;
  title: string;
  type: string;
  author?: string;
  description: string;
  level?: string;
  fileSize?: string;
  category?: string;
}

const ResourceCard = ({ 
  id, title, type, author, description, level, fileSize, category
}: ResourceCardProps) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    if (id) {
      navigate(`/ressources/${id}`);
    } else {
      console.log("No ID available for this resource");
    }
  };

  const getIcon = () => {
    switch(type.toLowerCase()) {
      case 'livre':
      case 'book':
        return <BookOpen className="h-5 w-5" />;
      case 'vidéo':
      case 'video':
        return <Video className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          {getIcon()}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <div className="flex flex-wrap justify-between items-center mt-1">
          {author && <p className="text-sm text-gray-500">{author}</p>}
          <Badge variant="outline">{type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 mb-2">{description}</p>
        {level && (
          <Badge variant="secondary" className="mt-2">
            {level}
          </Badge>
        )}
        {fileSize && (
          <p className="text-xs text-gray-500 mt-2">
            Taille: {fileSize}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleViewDetails}>
          Voir les détails
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResourceCard;
