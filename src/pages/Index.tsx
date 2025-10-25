import { Heart } from "lucide-react";
import { SkinAnalyzer } from "@/components/SkinAnalyzer";
import { SymptomChatbot } from "@/components/SymptomChatbot";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="text-center space-y-4 py-12">
          <div className="flex items-center justify-center gap-3">
            <Heart className="h-12 w-12 text-primary animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-medical bg-clip-text text-transparent">
              AI Health Finder
            </h1>
          </div>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Accessible healthcare for underserved communities
          </p>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Get AI-powered health assessments and find nearby medical facilities. 
            Upload skin condition images or describe your symptoms for immediate guidance.
          </p>
        </header>

        {/* Main Content - Two Columns on Desktop */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <SkinAnalyzer />
          <SymptomChatbot />
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-muted-foreground text-sm">
          <p className="mb-2">
            ⚕️ This tool provides general guidance only and is not a substitute for professional medical advice.
          </p>
          <p>
            For emergencies, call 911 immediately.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
