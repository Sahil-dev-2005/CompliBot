import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export const analyzeIntent = async (userMessage) => {
    console.log(`[Groq] ⚡ Processing: "${userMessage.substring(0, 20)}..."`);

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are 'CompliBot', a GST filing assistant. 
                    Classify the user's message into a strict JSON format.
                    
                    Intents:
                    1. "FILE_RETURN" (User wants to file GST, nil return, upload invoices)
                    2. "STATUS_CHECK" (User asks about status/history)
                    3. "KNOWLEDGE_QUERY" (Questions about rules, tax rates, penalties)
                    4. "GREETING" (Hi, Hello)
                    5. "OTHER" (Irrelevant)

                    Output Format:
                    {
                        "intent": "INTENT_NAME",
                        "reply": "Short helpful text (only for KNOWLEDGE_QUERY or GREETING)"
                    }
                    
                    Return ONLY raw JSON. No markdown formatting.`
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            // Use Llama 3 70B for best intelligence/speed balance
            model: "moonshotai/kimi-k2-instruct-0905", 
            
            // Force JSON mode (prevents markdown errors)
            response_format: { type: "json_object" }, 
            
            temperature: 0.1, // Keep it deterministic
        });

        const content = completion.choices[0]?.message?.content || "{}";
        const result = JSON.parse(content);

        console.log(`[Groq] ✅ Intent: ${result.intent}`);
        return result;

    } catch (error) {
        console.error("❌ [Groq Error]:", error.message);
        
        return { 
            intent: "OTHER", 
            reply: "I'm having trouble connecting to the server. Please try again." 
        };
    }
};