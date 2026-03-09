from time import time
import matplotlib.pyplot as plt
import numpy as np

from sklearn.cluster import KMeans
from sklearn.datasets import load_sample_image
from sklearn.metrics import pairwise_distances_argmin
from sklearn.utils import shuffle
from PIL import Image
palette_size = 4

img= Image.open('si-exercises/exercise_pso/image.png').convert("RGB") # Can be many different formats.

pixels = np.array(img).reshape(-1, 3)
curr_time = time()
kmeans = KMeans(n_clusters=palette_size, random_state=0).fit(pixels)
print(time() - curr_time)
labels = kmeans.predict(pixels)
print(kmeans.cluster_centers_)

def recreate_image(codebook, labels, w, h):
    """Recreate the (compressed) image from the codebook & labels"""
    image = codebook[labels].reshape(w, h, -1)
    # Ensure image is in uint8 [0-255] for imshow
    if image.max() <= 1.0:
        image = (image * 255).astype(np.uint8)
    else:
        image = image.astype(np.uint8)
    return image
adjusted_img_array = recreate_image(kmeans.cluster_centers_, labels, img.size[1], img.size[0])

def distance_color(color1, color2):
    return np.sqrt(np.sum((color1 - color2) ** 2))


fitness = sum(distance_color(pixel, clustered) for pixel, clustered in zip(pixels, adjusted_img_array))

print(fitness)

img_to_save = np.array(adjusted_img_array).reshape((128, 128, 3))
img = Image.fromarray(img_to_save.astype('uint8'))
img.save(f"results_kmeans/image.png")
# Display all results, alongside original image

#fig, axs = plt.subplots(2)
#axs[0].imshow(img)
#axs[0].set_title('Original Image')
#axs[0].axis("off")  # hides axes for original image
#axs[1].imshow(recreate_image(kmeans.cluster_centers_, labels, img.size[1], img.size[0]))
#axs[1].set_title('Quantized Image')
#axs[1].axis("off")  # hides axes for quantized image

#plt.show()