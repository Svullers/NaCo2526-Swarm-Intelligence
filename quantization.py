
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt

LIGHT_GREEN = np.array([175, 198, 144])
BROWN = np.array([83, 20, 14])
RED = np.array([185, 49, 40])
GREEN = np.array([124, 148, 71])
palette = [LIGHT_GREEN, BROWN, RED, GREEN]
def closest_color(requested_color, palette):
    closest = min(palette, key=lambda color: sum((c1 - c2) ** 2 for c1, c2 in zip(color, requested_color)))
    return closest



img = Image.open('si-exercises/exercise_pso/image.png').convert("RGB") # Can be many different formats.
img_array = np.array(img)
pixels = img_array.reshape(-1, 3)
adjusted_pixels = [closest_color(pixel, palette) for pixel in pixels]

adjusted_img_array = np.array(adjusted_pixels).reshape(img_array.shape)



fig, axs = plt.subplots(2)
axs[0].imshow(img_array)
axs[0].set_title('Original Image')
axs[0].axis("off")  # hides axes for original image
axs[1].imshow(adjusted_img_array)
axs[1].set_title('Quantized Image')
axs[1].axis("off")  # hides axes for quantized image

plt.show()





