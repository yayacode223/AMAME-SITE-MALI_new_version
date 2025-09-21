import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BourseResponse } from "@/service/bourseService";

// interface BourseCardProps {
//   id?: string;
//   title: string;
//   provider: string;
//   deadline: string;
//   country: string;
//   level: string;
//   description: string;
//   benefits?: string[];
// }

const BourseCard = ({
  id,
  titre,
  description_complete,
  urlSource,
  urlDrapeau,
  paysOffrant,
}: BourseResponse) => {
  // const handleViewDetails = () => {
  //   if (id) {
  //     navigate(`/bourses/${id}`);
  //   } else {
  //     console.log("No ID available for this bourse");
  //   }
  // };

  return (
    <Card className="h-full flex flex-col" key={id}>
      <CardHeader>
        <div>
          <img src={urlDrapeau} alt="flag" className="w-full object-cover"/>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="">
          <CardTitle className="text-lg">{titre}</CardTitle>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {description_complete}
          </p>
          <p>PAYS : {paysOffrant}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <a
            href={
              urlSource.startsWith("http") ? urlSource : `http://${urlSource}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center"
          >
            Voir plus d'info
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BourseCard;
