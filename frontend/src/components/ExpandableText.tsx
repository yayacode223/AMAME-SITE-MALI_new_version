import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableTextProps {
  text: string;
  maxWords?: number;
  className?: string;
  buttonClassName?: string;
}

export function ExpandableText({
  text,
  maxWords = 100,
  className = "leading-relaxed",
  buttonClassName,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  const words = text.trim().split(/\s+/);
  const needsTruncation = words.length > maxWords;

  const displayed = !needsTruncation || expanded
    ? text
    : words.slice(0, maxWords).join(" ") + "…";

  return (
    <div>
      <p className={`whitespace-pre-line ${className}`}>{displayed}</p>
      {needsTruncation && (
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className={`mt-2 inline-flex items-center gap-1 text-sm font-medium text-amame-green hover:text-amame-green-dark transition-colors ${buttonClassName ?? ""}`}
        >
          {expanded ? (
            <><ChevronUp className="h-4 w-4" />Voir moins</>
          ) : (
            <><ChevronDown className="h-4 w-4" />Voir la suite</>
          )}
        </button>
      )}
    </div>
  );
}

export default ExpandableText;
