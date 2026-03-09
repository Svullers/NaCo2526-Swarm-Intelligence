import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import sys
import matplotlib.cm as cm

# experiment = sys.argv[1]
# cellnrs = sys.argv[2]
# run = sys.argv[3]

dfops = pd.read_csv('./order-parameters.csv')
plt.figure()
# plt.xticks(np.arange(0, 5000, step=500), rotation=45)
plt.xlabel("Time (steps)")
plt.ylabel("Order parameter")
plt.title("Order Parameter over time")
plt.plot(dfops["t"], dfops['orderParam'])
plt.tight_layout()
plt.savefig('./order-parameters.png')
plt.close()
    
dfb = pd.read_csv('./boids.csv')

timesteps = sorted(dfb["t"].unique())
n_samples = 10
chosen = np.linspace(0, len(timesteps) - 1, n_samples, dtype=int)
chosen_timesteps = [timesteps[i] for i in chosen]

colours = cm.plasma(np.linspace(0.1, 0.9, n_samples))

fig, axes = plt.subplots(1, 2, figsize=(13, 5))
fig.suptitle("Nearest-Neighbour Distance Distribution Over Time", fontsize=14)

# --- Left: overlaid KDE curves per snapshot ---
ax = axes[0]
for t, colour in zip(chosen_timesteps, colours):
    distances = dfb[dfb["t"] == t]["nn_dis"]
    distances.plot.kde(ax=ax, label=f"t = {t}", color=colour, linewidth=2)

ax.set_xlabel("Nearest-Neighbour Distance")
ax.set_ylabel("Density")
ax.set_title("KDE per Snapshot")
ax.legend(title="Timestep")
ax.set_xlim(left=0)

# --- Right: mean ± std over all timesteps ---
ax2 = axes[1]
stats = dfb.groupby("t")["nn_dis"].agg(["mean", "std"]).reset_index()

ax2.plot(stats["t"], stats["mean"], color="steelblue", linewidth=2, label="Mean NN distance")
ax2.fill_between(
    stats["t"],
    stats["mean"] - stats["std"],
    stats["mean"] + stats["std"],
    alpha=0.3,
    color="steelblue",
    label="± 1 SD",
)
ax2.set_xlabel("Timestep")
ax2.set_ylabel("Nearest-Neighbour Distance")
ax2.set_title("Mean NN Distance Over Time")
ax2.legend()

plt.tight_layout()
plt.savefig("nn_distance_plot.png", dpi=150, bbox_inches="tight")
