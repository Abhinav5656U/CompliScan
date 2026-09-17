import os
import json
import google.generativeai as genai

def group_images_by_product(image_paths):
    """
    Given a list of image paths, uses Gemini Vision to group them by distinct products.
    Returns a list of lists containing the indices of the grouped images.
    Example: [[0, 1], [2], [3, 4]]
    """
    if not image_paths:
        return []
    
    # If there's only 1 image, no need to group
    if len(image_paths) == 1:
        return [[0]]
        
    try:
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("WARNING: GEMINI_API_KEY not found. Defaulting to one group per image.")
            return [[i] for i in range(len(image_paths))]
            
        genai.configure(api_key=api_key)
        
        prompt = """
You are a compliance assistant. Given these product packaging image crops, group them by distinct product based on visual similarity and brand. 
Return ONLY a valid JSON array of arrays, without any markdown formatting. 
Each inner array should contain the 0-indexed indices of the images that belong to the same product. 
For example, if image 0 and 1 belong to Product A, and image 2 belongs to Product B, return [[0, 1], [2]].
If all images belong to the same product, return [[0, 1, 2]].
"""
        import PIL.Image
        imgs = []
        for p in image_paths:
            img = PIL.Image.open(p)
            img.thumbnail((800, 800)) # Compress for API limits
            imgs.append(img)
        
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(
            [prompt] + imgs,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            ),
            request_options={"timeout": 60}
        )
                
        text = response.text
        if not text:
            print("Gemini returned empty response for grouping.")
            return [list(range(len(image_paths)))]
            
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        result = json.loads(text.strip())
        print(f"Grouped images into products: {result}")
        
        # Validation
        if not isinstance(result, list) or not all(isinstance(group, list) for group in result):
            raise ValueError("Invalid JSON format from Gemini")
            
        # Ensure all indices are accounted for, if not, append missing ones as separate groups
        found_indices = set()
        for group in result:
            found_indices.update(group)
            
        for i in range(len(image_paths)):
            if i not in found_indices:
                result.append([i])
                
        return result
    except Exception as e:
        print(f"Gemini Grouping Error: {e}")
        import traceback
        traceback.print_exc()
        # Fallback to individual images to prevent mixing unrelated products
        return [[i] for i in range(len(image_paths))]
