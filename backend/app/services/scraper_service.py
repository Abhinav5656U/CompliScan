import requests
from bs4 import BeautifulSoup
import json
import os
import google.generativeai as genai
import traceback

def extract_digital_listing_data(url: str):
    """
    Scrapes the provided E-commerce URL and uses Gemini to extract 
    Rule 6 compliance fields into a structured JSON format.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        print(f"[ScraperService] Fetching URL: {url}")
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "noscript"]):
            script.extract()
            
        text_content = soup.get_text(separator=' ', strip=True)
        # Truncate text if it's insanely large to fit within model context comfortably
        text_content = text_content[:200000] 
        
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("[ScraperService] Error: GEMINI_API_KEY not found.")
            return None
            
        genai.configure(api_key=api_key)
        
        # Use gemini-2.5-flash as per the codebase standard
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""
        You are an expert Legal Metrology compliance AI agent.
        Below is the raw scraped text from an e-commerce product page.
        Extract the following mandatory fields (Rule 6 of Legal Metrology Packaged Commodities Rules).
        If a field is missing, return null for it. DO NOT hallucinate.
        Return ONLY valid JSON. Do not include markdown blocks like ```json.
        
        Fields to extract:
        - mrp: (string) Maximum Retail Price (e.g. "₹500")
        - net_quantity: (string) The weight, volume, or count (e.g. "500g", "1 L")
        - manufacturer_name_address: (string) Full name and address of manufacturer/packer
        - country_of_origin: (string) The country where the product was made
        - customer_care: (string) Phone number or email for complaints
        - mfg_date: (string) Date of manufacture/packing
        
        Raw Scraped Text:
        {text_content}
        """
        
        print("[ScraperService] Sending scraped text to Gemini...")
        generation_config = genai.GenerationConfig(response_mime_type="application/json")
        result = model.generate_content(prompt, generation_config=generation_config)
        
        if not result.text:
            print("[ScraperService] Gemini returned empty text.")
            return None
            
        text = result.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        parsed_data = json.loads(text.strip())
        print(f"[ScraperService] Successfully extracted: {parsed_data}")
        return parsed_data
        
    except Exception as e:
        print(f"[ScraperService] Scraper Error: {e}")
        traceback.print_exc()
        return None
