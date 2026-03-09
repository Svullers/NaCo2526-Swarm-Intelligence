from PIL import Image
import numpy as np
import matplotlib.pyplot as plt
import time
TOTAL_ITERATIONS = 10

def distance_color(color1, color2):
    return np.sqrt(np.sum((color1 - color2) ** 2))


def closest_color(requested_color, palette):
    closest = min(palette, key=lambda color: sum((c1 - c2) ** 2 for c1, c2 in zip(color, requested_color)))
    return closest


#particles is Xi and Z are all the pixels in the dataset
def eval_cluster_distance(particle, Z):
    
    #Assign each pixel in Z to the closest color in the particle
    clustered_pixels = [closest_color(pixel, particle) for pixel in Z]

    #Now we will evaluate the quality of the clustering
    #This will be done via distance between the clustered pixels and the original pixels
    fitness = sum(distance_color(pixel, clustered) for pixel, clustered in zip(Z, clustered_pixels))
    return fitness


def PSO(pixels, eval_func, num_particles, pallete_size = 4, iterations=TOTAL_ITERATIONS, w=0.5, a1=1.0, a2=1.0):
    curr_time = time.time()
    M = pixels.shape[0] #Num of pixels
    
    particles = np.random.uniform(0, 255, size=(num_particles, pallete_size, 3))
    velocities = np.zeros((num_particles, pallete_size, 3))

    local_best = particles.copy()
    local_best_fitness = np.full(num_particles, np.inf)
    global_best = np.random.uniform(0, 255, size=(pallete_size, 3))
    global_best_fitness = np.inf


    particles_state = []
    global_best_state = []
    global_best_fitness_state = []
    iteration = 0
    while iteration <= iterations:
        

        for i in range(num_particles):

            r1 = np.random.rand(pallete_size, 3)
            r2 = np.random.rand(pallete_size, 3)

            # Update velocities
            velocities[i] = (
                w * velocities[i] +
                a1 * r1 * (local_best[i] - particles[i]) +
                a2 * r2 * (global_best - particles[i])
            )

        
        for i in range(num_particles):
            # Update positions
            particles[i] += velocities[i]
            particles[i] = np.clip(particles[i], 0, 255)

            fitness = eval_func(particles[i], pixels)

            if(fitness < local_best_fitness[i]):
                local_best_fitness[i] = fitness

            if(fitness < global_best_fitness):
                global_best_fitness = fitness
                global_best = particles[i].copy()

        #Exercise states that we have to save this at each iteration.
        particles_state.append(particles.copy())
        global_best_state.append(global_best.copy())
        global_best_fitness_state.append(global_best_fitness)
        
        if(iteration % 5 == 0):
            print(f"Iteration {iteration} - Global Best Fitness: {global_best_fitness:.4f}")
            print(f"Global Best Colors: {global_best.astype(int)}")
            print(f"Time taken for iteration {iteration}: {time.time() - curr_time:.2f} seconds")
        iteration += 1
    print("Total time taken for PSO: ", time.time() - curr_time)
    return particles_state, global_best_state, global_best_fitness_state




#Okay lets try it out
img= Image.open('si-exercises/exercise_pso/image.png').convert("RGB")
img_array = np.array(img)
pixels = img_array.reshape(-1, 3).astype(float)

particles_states, global_best_states, global_best_fitness_states= PSO(pixels, eval_cluster_distance, num_particles=40)
  
# Determine how many snapshots we want: every 5 iterations + last one if not divisible
snapshot_indices = list(range(0, TOTAL_ITERATIONS, 5))
if TOTAL_ITERATIONS not in snapshot_indices:
    snapshot_indices.append(TOTAL_ITERATIONS)

num_subplots = len(snapshot_indices) + 1  # +1 for original image

fig, axs = plt.subplots(num_subplots, figsize=(6, num_subplots * 3))
axs = np.atleast_1d(axs)

# Original image
axs[0].imshow(img_array)
axs[0].set_title('Original Image')
axs[0].axis("off")

# Quantized images with fitness
for idx, iteration in enumerate(snapshot_indices):
    adjusted_pixels = np.array([
        closest_color(pixel, global_best_states[iteration].astype(int)) 
        for pixel in pixels
    ])
    adjusted_img_array = adjusted_pixels.reshape(img_array.shape)

    fitness = global_best_fitness_states[iteration]
    img_to_save = np.array(adjusted_img_array).reshape((128, 128, 3))
    img = Image.fromarray(img_to_save.astype('uint8'))
    img.save(f"results_pso/image_{iteration}.png")
    print(iteration, fitness)
    axs[idx + 1].imshow(adjusted_img_array)
    axs[idx + 1].set_title(f'Iteration {iteration} — Fitness: {fitness:.4f}')
    axs[idx + 1].axis("off")

plt.tight_layout()
plt.show()