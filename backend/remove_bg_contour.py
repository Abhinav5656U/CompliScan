import cv2
import numpy as np
import os

def remove_background(input_path, output_path):
    print(f"Processing {input_path}...")
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Image not found!")
        return

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # The background is a light studio gradient, but the packet has strong edges.
    # We can use Canny edge detection to find the packet outline.
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 30, 150)
    
    # Dilate edges to connect them
    kernel = np.ones((5,5), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=3)
    
    # Find contours
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        print("No contours found.")
        return
        
    # Find the largest contour (assuming it's the packet)
    largest_contour = max(contours, key=cv2.contourArea)
    
    # Create an empty mask
    mask = np.zeros(img.shape[:2], dtype=np.uint8)
    
    # Draw the filled contour onto the mask
    cv2.drawContours(mask, [largest_contour], -1, 255, -1)
    
    # Add an alpha channel to the original image based on the mask
    b, g, r = cv2.split(img[:,:,:3]) # Ensure we only take BGR if it's already BGRA
    rgba = cv2.merge([b, g, r, mask])
    
    cv2.imwrite(output_path, rgba)
    print(f"Saved to {output_path}")

def main():
    base_dir = '../frontend/public/assets/packaging/'
    front_in = os.path.join(base_dir, 'nova-crunch-front.png')
    front_out = os.path.join(base_dir, 'nova-crunch-front-texture.png')
    
    back_in = os.path.join(base_dir, 'nova-crunch-back.png')
    back_out = os.path.join(base_dir, 'nova-crunch-back-texture.png')
    
    remove_background(front_in, front_out)
    remove_background(back_in, back_out)

if __name__ == '__main__':
    main()
