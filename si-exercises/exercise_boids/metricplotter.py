import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import sys
import matplotlib.cm as cm
from matplotlib.colors import Normalize
from matplotlib.cm import ScalarMappable

# experiment = sys.argv[1]
# cellnrs = sys.argv[2]
# run = sys.argv[3]
dfops = pd.read_csv('./csvs/order-parameters.csv')   
dfb = pd.read_csv('./csvs/boids.csv')
timesteps = sorted(dfb["t"].unique())
n_samples = 50

def plot_orderparams():
    plt.figure()
    # plt.xticks(np.arange(0, 5000, step=500), rotation=45)
    plt.xlabel("Time (steps)")
    plt.ylabel("Order parameter")
    plt.title("Order Parameter over time")
    plt.plot(dfops["t"], dfops['orderParam'])
    plt.tight_layout()
    plt.savefig('./plots/order-parameters.png')
    plt.close()

def plot_nn_distance():
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

    norm = Normalize(vmin=min(chosen_timesteps), vmax=max(chosen_timesteps))
    sm = ScalarMappable(cmap="plasma", norm=norm)
    sm.set_array([])  # required dummy call

    cbar = fig.colorbar(sm, ax=ax)
    cbar.set_label("Timestep", fontsize=12)

    ax.set_xlabel("Nearest-Neighbour Distance")
    ax.set_ylabel("Density")
    ax.set_title("KDE per Snapshot")
    # ax.legend(title="Timestep")
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
    plt.savefig("plots/nn_distance_plot.png", dpi=150, bbox_inches="tight")
    plt.close()

def plot_angles():
    chosen = np.linspace(0, len(timesteps) - 1, n_samples, dtype=int)
    chosen_timesteps = [timesteps[i] for i in chosen]

    fig, ax = plt.subplots(1, 1, figsize=(13, 5))
    fig.suptitle("Angle Count Distribution Over Time", fontsize=14)
    angles = []
    for t in chosen_timesteps:
        angles = dfb[dfb["t"] == t]["angle"]
        ax.scatter([t]*len(angles), angles)

    ax.set_xlabel("Time")
    ax.set_ylabel("Angels")
    ax.set_title("Scatter per Snapshot")
    ax.set_xlim(left=0)
    plt.tight_layout()
    plt.savefig("plots/angle_plot.png", dpi=150, bbox_inches="tight")
    plt.close()

# plot_orderparams()
plot_nn_distance()
# plot_angles()