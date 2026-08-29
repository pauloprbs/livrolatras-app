import sys
from PIL import Image
from collections import Counter

def get_dominant_colors(image_path, num_colors=3):
    try:
        img = Image.open(image_path)
        img = img.convert('RGB')
        img = img.resize((50, 50))
        colors = img.getdata()
        counts = Counter(colors)
        dominant = counts.most_common(num_colors)
        for count, color in enumerate(dominant):
            r, g, b = color[0]
            hex_color = "#{:02x}{:02x}{:02x}".format(r, g, b)
            print(f"Image {image_path}, Color {count+1}: {hex_color} (RGB: {r},{g},{b}) - Freq: {color[1]}")
    except Exception as e:
        print(f"Error reading {image_path}: {e}")

get_dominant_colors("../apps/web/imgs/logo_01.jpeg")
get_dominant_colors("../apps/web/imgs/logo_02.jpeg")
get_dominant_colors("../apps/web/imgs/logo_03.jpeg")
