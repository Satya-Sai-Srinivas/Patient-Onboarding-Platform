import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";

import IconBackPoly from "../../../../src/assets/icons/icon-polygon.svg";
interface NavigationProps {
  title: string;
  showBackButton?: boolean;
}

export default function Navigation({ title, showBackButton = true }: NavigationProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-card border-b shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {showBackButton ? (
          
          <button
          type="button"
          className="back-home"
          onClick={() => navigate("/")}
          aria-label="Back to Home"
        >
          <img className="back-icon" src={IconBackPoly} alt="" aria-hidden="true" />
          <span className="back-text">Home</span>
        </button>
        ) : (
          <div className="w-20" />
        )}
        
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>
        
        <div className="w-20" />
      </div>
    </div>
  );
}