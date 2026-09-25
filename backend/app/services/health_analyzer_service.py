import os
import json
from groq import Groq

def analyze_health_and_nutrition(ingredients, nutrition, user_allergies=None, user_diet=None):
    """
    Evaluates ingredients and nutritional info against health guidelines.
    Returns a dict with health_score, warnings, and status.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here":
        return {
            "rule_name": "Health & Nutrition Analysis",
            "status": "human_review_required",
            "message": "GROQ_API_KEY missing for health analysis.",
            "severity": "warning"
        }

    prompt = f"""
    You are an expert FSSAI health and nutrition auditor.
    Analyze the following ingredients and nutritional information (per 100g) of a product.
    
    Ingredients: {ingredients}
    Nutritional Info: {nutrition}
    
    1. Check for harmful or highly controversial additives (e.g., artificial colors, excessive preservatives, palm oil, MSG, trans fats).
    2. Check if sugar exceeds 10g per 100g.
    3. Check if sodium exceeds 400mg per 100g.
    
    User Profile Context:
    - User Allergies: {user_allergies or 'None'}
    - User Diet Preferences: {user_diet or 'None'}
    
    CRITICAL: If the product contains any ingredients that violate the user's allergies or diet preferences, you MUST flag it prominently.
    
    Provide a "status": "pass" if it's generally healthy and fits the user profile, "likely_violation" if it has minor issues, or "fail" if it contains harmful additives, extremely high sugar/sodium, or violates the user's allergies/diet.
    Also provide a "health_score" from 0 to 100 (100 being healthiest).
    Provide a short "message" summarizing the findings, warnings, and highlighting any allergy/diet violations.
    
    Return ONLY valid JSON matching this schema:
    {{
        "status": "pass" | "likely_violation" | "fail",
        "health_score": integer,
        "message": "Short summary of warnings"
    }}
    """
    
    try:
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}],
            model="llama3-70b-8192",
            temperature=0,
            max_tokens=300,
            response_format={"type": "json_object"},
            timeout=15
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        result = json.loads(response_text)
        
        return {
            "rule_name": "Health & Nutrition Analysis (AI)",
            "status": result.get("status", "human_review_required"),
            "message": f"Score: {result.get('health_score', 'N/A')}/100. {result.get('message', '')}",
            "severity": "critical" if result.get("status") == "fail" else "warning",
            "health_score": result.get("health_score")
        }
    except Exception as e:
        print(f"Health Analysis Error: {e}")
        return {
            "rule_name": "Health & Nutrition Analysis",
            "status": "human_review_required",
            "message": "Failed to analyze health data.",
            "severity": "warning"
        }

def detect_greenwashing(marketing_claims, ingredients, nutrition):
    """
    Evaluates marketing claims against actual ingredients to detect greenwashing.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here":
        return {
            "rule_name": "Greenwashing & False Claims Detection",
            "status": "human_review_required",
            "message": "GROQ_API_KEY missing for greenwashing analysis.",
            "severity": "warning"
        }

    prompt = f"""
    You are an expert FSSAI consumer protection auditor specializing in detecting "greenwashing" and false claims.
    Compare the following front-of-pack marketing claims against the actual back-of-pack ingredients and nutritional info.
    
    Marketing Claims: {marketing_claims}
    Ingredients: {ingredients}
    Nutritional Info: {nutrition}
    
    1. Look for contradictions. (e.g., Claim says "100% Natural" but ingredients contain artificial colors/preservatives).
    2. Look for deceptive sugar claims. (e.g., Claim says "No Added Sugar" but ingredients contain Maltodextrin, High Fructose Corn Syrup, or Fruit Juice Concentrate).
    3. Look for deceptive "Real Fruit" or "Whole Wheat" claims where the percentage is actually negligible.
    
    Provide a "status": "pass" if claims are honest, "likely_violation" if claims are slightly exaggerated, or "fail" if claims directly contradict ingredients (Greenwashing).
    Provide a short "evidence" summarizing exactly why it's deceptive, or null if honest.
    
    Return ONLY valid JSON matching this schema:
    {{
        "status": "pass" | "likely_violation" | "fail",
        "evidence": "string explaining the deception or null"
    }}
    """
    
    try:
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}],
            model="llama3-70b-8192",
            temperature=0,
            max_tokens=300,
            response_format={"type": "json_object"},
            timeout=15
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        result = json.loads(response_text)
        
        status = result.get("status", "human_review_required")
        evidence = result.get("evidence")
        
        return {
            "rule_name": "Deceptive Marketing (Greenwashing)",
            "status": status,
            "message": evidence if evidence else "Marketing claims align with actual ingredients.",
            "citation": "Consumer Protection Act / FSSAI Claims",
            "severity": "critical" if status == "fail" else ("warning" if status == "likely_violation" else "info")
        }
    except Exception as e:
        print(f"Greenwashing Analysis Error: {e}")
        return {
            "rule_name": "Deceptive Marketing (Greenwashing)",
            "status": "human_review_required",
            "message": "Failed to analyze greenwashing data.",
            "severity": "warning"
        }
