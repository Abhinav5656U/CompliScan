import os
from rembg import remove

def process_image(input_path, output_path):
    print(f"Processing {input_path}...")
    with open(input_path, 'rb') as i:
        with open(output_path, 'wb') as o:
            input_bytes = i.read()
            output_bytes = remove(input_bytes)
            o.write(output_bytes)
    print(f"Saved to {output_path}")

def main():
    base_dir = '../frontend/public/assets/packaging/'
    front_in = os.path.join(base_dir, 'nova-crunch-front.png')
    front_out = os.path.join(base_dir, 'nova-crunch-front-texture.png')
    
    back_in = os.path.join(base_dir, 'nova-crunch-back.png')
    back_out = os.path.join(base_dir, 'nova-crunch-back-texture.png')
    
    process_image(front_in, front_out)
    process_image(back_in, back_out)
    
if __name__ == '__main__':
    main()
