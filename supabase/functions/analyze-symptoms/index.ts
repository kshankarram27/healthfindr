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
    const { symptoms, address } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing symptoms:', symptoms);

    // Call Lovable AI
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
            content: `You are a compassionate medical triage AI assistant helping underserved communities. When someone describes symptoms:

1. Acknowledge their concerns with empathy
2. Assess severity based on symptoms:
   - MILD: Common cold, minor headache, slight fever - suggest Primary Care Clinic
   - MODERATE: Persistent pain, moderate fever, vomiting - suggest Urgent Care or Doctor's Office
   - SEVERE: Chest pain, difficulty breathing, severe bleeding, signs of stroke - STRONGLY recommend Emergency Room

3. Provide clear, actionable guidance
4. Always recommend professional medical evaluation
5. For severe symptoms, emphasize going to ER immediately

Keep responses concise (3-4 sentences) and compassionate. End with the recommended facility type.`
          },
          {
            role: 'user',
            content: symptoms
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

    // Determine facility type from AI response
    const lowerAnalysis = analysis.toLowerCase();
    let facilityType = 'Primary Care Clinic';
    
    if (lowerAnalysis.includes('emergency') || lowerAnalysis.includes('911') || lowerAnalysis.includes('er') || lowerAnalysis.includes('immediately')) {
      facilityType = 'Emergency Room';
    } else if (lowerAnalysis.includes('urgent care') || lowerAnalysis.includes('doctor')) {
      facilityType = "Doctor's Office";
    }

    // Create Google Maps search URL
    const encodedAddress = encodeURIComponent(address);
    const encodedFacility = encodeURIComponent(facilityType);
    const mapUrl = `https://www.google.com/maps/search/${encodedFacility}+near+${encodedAddress}`;

    return new Response(
      JSON.stringify({
        analysis: analysis,
        facilityType: facilityType,
        mapUrl: mapUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-symptoms function:', error);
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
