import cv2
import numpy as np
import os

def process_image_grabcut(input_path, output_path):
    print(f"Processing {input_path} with GrabCut...")
    img = cv2.imread(input_path)
    if img is None:
        print("Image not found!")
        return

    # Create a mask
    mask = np.zeros(img.shape[:2], np.uint8)
    
    # Create background and foreground models
    bgdModel = np.zeros((1,65), np.float64)
    fgdModel = np.zeros((1,65), np.float64)
    
    # Define a rectangle that roughly bounds the packet. 
    # The packet is in the center, so we leave a 5% margin.
    h, w = img.shape[:2]
    margin_x = int(w * 0.1)
    margin_y = int(h * 0.05)
    rect = (margin_x, margin_y, w - 2*margin_x, h - 2*margin_y)
    
    # Apply GrabCut
    cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
    
    # Modify mask: 0 and 2 are background, 1 and 3 are foreground
    mask2 = np.where((mask==2)|(mask==0), 0, 1).astype('uint8')
    
    # Create an RGBA image
    b, g, r = cv2.split(img)
    alpha = mask2 * 255
    
    # Optional: smooth the edges slightly
    alpha = cv2.GaussianBlur(alpha, (3,3), 0)
    
    rgba = cv2.merge([b, g, r, alpha])
    
    cv2.imwrite(output_path, rgba)
    print(f"Saved transparent image to {output_path}")

def main():
    base_dir = '../frontend/public/assets/packaging/'
    front_in = os.path.join(base_dir, 'nova-crunch-front.png')
    front_out = os.path.join(base_dir, 'nova-crunch-front-texture.png')
    
    back_in = os.path.join(base_dir, 'nova-crunch-back.png')
    back_out = os.path.join(base_dir, 'nova-crunch-back-texture.png')
    
    process_image_grabcut(front_in, front_out)
    process_image_grabcut(back_in, back_out)

if __name__ == '__main__':
    main()
