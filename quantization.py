
from PIL import Image

LIGHT_GREEN = (175, 198, 144)
BROWN = (83,20,14)
RED = (185,49,40)
GREEN = (124,148,71)

def closest_color(requested_color):
    colors = [LIGHT_GREEN, BROWN, RED, GREEN]
    return min(colors, key=lambda color: sum((c1 - c2) ** 2 for c1, c2 in zip(color, requested_color)))



im = Image.open('si-exercises/exercise_pso/image.png') # Can be many different formats.
pix = im.load()
for width in range(im.size[0]):
    for height in range(im.size[1]):
        pix[width, height] = closest_color(pix[width, height])
im.save('si-exercises/exercise_pso/alive_parrot.png')  # Save the modified pixels as .png





