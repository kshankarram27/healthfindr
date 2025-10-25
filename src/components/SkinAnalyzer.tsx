import { useState } from "react";
import { Upload, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const SkinAnalyzer = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [address, setAddress] = useState("");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    if (!address.trim()) {
      toast.error("Please enter your address");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        
        // Call the edge function (we'll create this next)
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-skin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            image: base64Image,
            address: address,
          }),
        });

        if (!response.ok) {
          throw new Error('Analysis failed');
        }

        const data = await response.json();
        setResult(data);
        toast.success("Analysis complete!");
      };
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Upload className="h-6 w-6 text-primary" />
          Skin Condition Analyzer
        </CardTitle>
        <CardDescription>
          Upload a photo of your skin condition for AI-powered analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Your Address</Label>
            <Input
              id="address"
              placeholder="Enter your address for nearby facility recommendations"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-upload">Upload Image</Label>
            <div className="relative">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="cursor-pointer"
              />
            </div>
          </div>

          {previewUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
              <img
                src={previewUrl}
                alt="Preview"
                className="object-contain w-full h-full"
              />
            </div>
          )}

          <Button
            onClick={analyzeImage}
            disabled={!selectedImage || !address || isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Skin Condition"
            )}
          </Button>
        </div>

        {result && (
          <div className="space-y-4 p-6 bg-gradient-hero rounded-lg border">
            <h3 className="font-semibold text-lg">Analysis Results</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Condition:</span> {result.condition}
              </p>
              <p className="text-sm">
                <span className="font-medium">Severity:</span>{" "}
                <span
                  className={
                    result.severity === "severe"
                      ? "text-destructive font-semibold"
                      : "text-success font-semibold"
                  }
                >
                  {result.severity}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium">Recommendation:</span> {result.recommendation}
              </p>
            </div>

            {result.mapUrl && (
              <Button
                variant="default"
                className="w-full"
                onClick={() => window.open(result.mapUrl, '_blank')}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Get Directions to {result.facilityType}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
