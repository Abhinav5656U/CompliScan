import os
from groq import Groq

def evaluate_rule(prompt, text):
    """
    Evaluates a semantic compliance rule against the extracted text using Groq.
    Returns "PASS", "FAIL", or "REVIEW".
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here":
        print("WARNING: GROQ_API_KEY not found or not set. Falling back to REVIEW.")
        return {"status": "human_review_required", "evidence": None}

    try:
        client = Groq(api_key=api_key)
        
        system_prompt = f"""
        You are a strict Legal Metrology compliance auditor. 
        Your job is to evaluate if the provided packaging text complies with the following rule.
        
        RULE TO EVALUATE:
        {prompt}
        
        You must respond with valid JSON matching this schema exactly:
        {{
            "status": "PASS" or "FAIL",
            "evidence": "exact short quote from text that justifies this, or null if missing"
        }}
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Packaging Text:\n{text}"
                }
            ],
            model="qwen/qwen3.8-27b",
            temperature=0,
            max_tokens=300,
            response_format={"type": "json_object"},
            timeout=15
        )

        import json
        response_text = chat_completion.choices[0].message.content.strip()
        result = json.loads(response_text)
        
        status = result.get("status", "").upper()
        evidence = result.get("evidence")
        
        if status == "PASS":
            return {"status": "pass", "evidence": evidence}
        elif status == "FAIL":
            return {"status": "fail", "evidence": evidence}
        else:
            return {"status": "human_review_required", "evidence": None}

    except Exception as e:
        print(f"Groq Evaluation Error: {e}")
        return {"status": "human_review_required", "evidence": None}
