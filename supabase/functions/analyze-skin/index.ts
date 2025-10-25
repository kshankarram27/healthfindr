import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, address } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing skin condition image...');

    // Call Lovable AI with vision capabilities
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a medical triage AI assistant helping underserved communities. Analyze skin condition images and provide:
1. A brief description of what you observe
2. Severity assessment (mild, moderate, or severe)
3. Whether the person should see a dermatologist (mild-moderate) or go to ER (severe)

Be compassionate, clear, and err on the side of caution. Always recommend professional medical evaluation.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this skin condition image and assess its severity.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error('AI analysis failed');
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    console.log('AI Analysis:', analysis);

    // Determine severity and facility type from AI response
    const lowerAnalysis = analysis.toLowerCase();
    let severity = 'mild';
    let facilityType = 'Dermatologist';
    
    if (lowerAnalysis.includes('severe') || lowerAnalysis.includes('emergency') || lowerAnalysis.includes('urgent')) {
      severity = 'severe';
      facilityType = 'Emergency Room';
    } else if (lowerAnalysis.includes('moderate')) {
      severity = 'moderate';
      facilityType = 'Dermatologist';
    }

    // Create Google Maps search URL
    const encodedAddress = encodeURIComponent(address);
    const encodedFacility = encodeURIComponent(facilityType);
    const mapUrl = `https://www.google.com/maps/search/${encodedFacility}+near+${encodedAddress}`;

    return new Response(
      JSON.stringify({
        condition: analysis.split('\n')[0], // First line as condition
        severity: severity,
        recommendation: analysis,
        facilityType: facilityType,
        mapUrl: mapUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-skin function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
