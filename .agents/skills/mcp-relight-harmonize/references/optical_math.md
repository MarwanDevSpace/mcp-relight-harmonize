# Mathematical Foundations: Optical Profiling & Color Science

This document details the exact physics and mathematical formulations implemented across the `mcp-relight-harmonize` engine.

---

## 1. Correlated Color Temperature (CCT) Formulation

### Step 1: sRGB Gamma Linearization
Given non-linear sRGB channels $C \in \{R, G, B\} \in [0, 255]$, normalize $c = C / 255.0$:

$$
c_{\text{linear}} = \begin{cases} 
\frac{c}{12.92}, & c \le 0.04045 \\
\left(\frac{c + 0.055}{1.055}\right)^{2.4}, & c > 0.04045 
\end{cases}
$$

### Step 2: Linear sRGB to CIE 1931 XYZ Conversion
Using the standard CIE D65 transformation matrix:

$$
\begin{bmatrix} X \\ Y \\ Z \end{bmatrix} = 
\begin{bmatrix}
0.4124564 & 0.3575761 & 0.1804375 \\
0.2126729 & 0.7151522 & 0.0721750 \\
0.0193339 & 0.1191920 & 0.9503041
\end{bmatrix}
\begin{bmatrix} r_{\text{linear}} \\ g_{\text{linear}} \\ b_{\text{linear}} \end{bmatrix}
$$

### Step 3: Chromaticity Coordinates $(x, y)$
$$
x = \frac{X}{X + Y + Z}, \quad y = \frac{Y}{X + Y + Z}
$$

### Step 4: McCamy's Cubic Approximation
Given the chromaticity epicenter $(x_e = 0.3320, y_e = 0.1858)$:

$$
n = \frac{x - 0.3320}{0.1858 - y}
$$

$$
\text{CCT} = 449.0 n^3 + 3525.0 n^2 + 6823.3 n + 5520.33 \quad [\text{Kelvin}]
$$

---

## 2. 3D Surface Normals & Light Vector Estimation

### Step 1: Edge-Preserving Bilateral Filtering
To remove high-frequency sensor noise while preserving structural depth edges:

$$
I_{\text{smooth}}(x, y) = \frac{1}{W_p} \sum_{q \in \Omega} I(q) \cdot G_{\sigma_s}(\|p - q\|) \cdot G_{\sigma_r}(\|I(p) - I(q)\|)
$$

### Step 2: Surface Gradient Tensors
Calculate horizontal and vertical derivatives using $3 \times 3$ Sobel operators:

$$
G_x = \frac{\partial I_{\text{smooth}}}{\partial x}, \quad G_y = \frac{\partial I_{\text{smooth}}}{\partial y}
$$

### Step 3: Normal Vector Normalization
Let surface tangent vectors be defined with gradient scale factor $k = 8.0$:

$$
\vec{N}(x, y) = \frac{(-k G_x, -k G_y, 1)}{\sqrt{k^2 G_x^2 + k^2 G_y^2 + 1}}
$$

### Step 4: Dominant Light Vector & Angles
Highlight weighting assigns illumination priority to specular reflections where luminance exceeds the mean:

$$
w(x, y) = \max\left(I(x, y) - \bar{I}, 0\right)^2
$$

$$
\vec{L} = \frac{\sum w(x, y) \vec{N}(x, y)}{\left\|\sum w(x, y) \vec{N}(x, y)\right\|} = (L_x, L_y, L_z)
$$

Spherical angles (Azimuth $\theta \in [0, 360^\circ]$, Elevation $\phi \in [0, 90^\circ]$):

$$
\theta = \text{atan2}(-L_y, L_x) \pmod{360^\circ}
$$

$$
\phi = \text{atan2}\left(L_z, \sqrt{L_x^2 + L_y^2}\right)
$$

---

## 3. Reinhard Color Transfer Formulation

In Ruderman's decorrelated $l\alpha\beta$ color space, luminance ($l$), yellow-blue ($\alpha$), and red-green ($\beta$) channels are statistically orthogonal:

$$
x_{\text{harmonized}} = \left(x - \mu_{\text{source}}\right) \cdot \left(\frac{\sigma_{\text{target}}}{\sigma_{\text{source}}}\right) + \mu_{\text{target}}
$$

Where $\mu$ and $\sigma$ are the empirical mean and standard deviation along each respective channel.
