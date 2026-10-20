"""Exports the game's A3500X pistol as the web quest's starter pistol (public/breach/private/a3500x.glb), headless, without
Unity.

Call (from the site repo):
  "<blender.exe>" -b --factory-startup --python scripts/export_a3500x.py -- <A3500X dir> public/breach/private/a3500x.glb

<A3500X dir> is Assets/_Project/Art/Weapons/A3500X of the Unity project (Models/A3500X black.fbx, Textures/A3500X black/,
Textures/magazine/).

LICENSE: the A3500X is a Unity Asset Store asset (Standard EULA). It may ship inside our product, but its files must not be
redistributed, and the site repository is public. The output therefore goes to public/breach/private/, which is in
.gitignore: the GLB is generated locally from the private game repo before every build/deploy and never committed
(DEPLOY.md). The page falls back to the old block pistol with a console warning when the file is missing.

What the script does:
- drops the seven hidden rounds inside the magazine (only the top round shows through the ejection port),
- joins everything into one mesh with the two materials (gun, magazine) and decimates it to about TARGET_TRIS triangles,
- paints out the maker's lettering, model names, place names and the serial number (FIREARMED, A3500X, EXETER NH, MADE IN
  USA, ...) in all texture maps, the way Tools/Blender/clean_desert_eagle_textures.py of the game does it for the Desert
  Eagle: each stamp sits on a flat plate and is replaced by the plate's own blurred surface (normal map: flat plate),
- bakes the ambient occlusion into the base color, packs roughness (G) and metallic (B) into one map, all JPEG; the gun
  maps are TEX_SIZE px, the magazine maps (mostly hidden in the grip) MAG_TEX_SIZE px,
- scales the pistol to LENGTH m and moves it so the grip point (middle of the grip, where the palm sits) is the origin,
  and adds a Muzzle empty at the barrel's mouth.
glTF is +Y up, the muzzle points to +Z, the grip point is the origin (same convention as golden_deagle.glb).
"""
import os
import sys
import tempfile

import bpy
import numpy as np
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = argv[0], argv[1]
FBX = os.path.join(SRC, 'Models', 'A3500X black.fbx')
TEX = os.path.join(SRC, 'Textures')
TARGET_TRIS = 7600
TEX_SIZE = 1024
MAG_TEX_SIZE = 512
WORK = 2048
LENGTH = 0.19
AO_STRENGTH = 0.8
HIDDEN = [f'{kind}{i}_low' for kind in ('bullet', 'coverbullet') for i in range(2, 9)]

# Lettering boxes (x0, y0, x1, y1) in 4096-px image coordinates, top left origin, found on the normal maps (the
# engravings) and the base color (the printed grip logos and the serial number).
STAMPS = {
    'gun': [
        (1680, 335, 2215, 410),    # FIREARMED A3500X on the slide
        (358, 1321, 488, 1368),    # A3500X (small, frame)
        (1345, 1920, 1485, 2285),  # MANUAL ... USE / A3500X READ BEFORE USE
        (610, 3553, 692, 3877),    # FIREARMED, left grip panel
        (1884, 3533, 2003, 3871),  # FIREARMED, right grip panel
        (1663, 3949, 1839, 3990),  # FIREARMED, under the grip
        (610, 4010, 762, 4055),    # serial number
        (3314, 2212, 3375, 2380),  # EXETER, NH
        (2249, 3133, 2359, 3179),  # AO SW
        (3097, 3574, 3170, 3758),  # A3500X (frame side)
    ],
    'magazine': [
        (2711, 2277, 3113, 2368),  # FIREARMED, base plate
        (1073, 3080, 1507, 3162),  # MADE IN USA
        (868, 3604, 975, 3666),    # 380
        (688, 3924, 1098, 4022),   # FIREARMED, magazine side
    ],
}
PAD = 10
TMP = tempfile.mkdtemp(prefix='zrb_a3500x_')


# ---------------------------------------------------------------- textures

def load(path, size):
    """Image as float array (rows from the top), scaled to size x size."""
    img = bpy.data.images.load(path)
    img.colorspace_settings.name = 'Non-Color'  # raw values; the exporter is told the colour space by the node setup
    if img.size[0] != size:
        img.scale(size, size)
    a = np.empty(size * size * 4, dtype=np.float32)
    img.pixels.foreach_get(a)
    bpy.data.images.remove(img)
    return a.reshape(size, size, 4)[::-1].copy()


def box_blur(a, r, axis):
    pad = [(0, 0)] * a.ndim
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis)
    n = a.shape[axis]
    hi = np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis)
    lo = np.take(c, np.arange(0, n), axis=axis)
    return (hi - lo) / (2 * r + 1)


def blur(a, r):
    for _ in range(3):
        a = box_blur(box_blur(a, r, 0), r, 1)
    return a


def clean(a, boxes, normal):
    """Replaces every stamp box by the blurred plate around it (a flat plate on the normal map), feathered."""
    k = a.shape[0] / 4096
    for x0, y0, x1, y1 in boxes:
        x0, y0, x1, y1 = (int(round(v * k)) for v in (x0 - PAD, y0 - PAD, x1 + PAD, y1 + PAD))
        h, w = y1 - y0, x1 - x0
        r = max(3, min(h, w) // 2)
        m = 2 * r
        Y0, Y1, X0, X1 = max(0, y0 - m), min(a.shape[0], y1 + m), max(0, x0 - m), min(a.shape[1], x1 + m)
        region = a[Y0:Y1, X0:X1, :3]
        # Weight: the ring around the box counts, the box itself (the lettering) does not.
        weight = np.ones(region.shape[:2], dtype=np.float32)
        weight[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = 0.0
        num = blur(region * weight[..., None], r)
        den = blur(weight, r)[..., None]
        fill = num / np.maximum(den, 1e-4)
        if normal:
            # Flat plate: keep the plate's average tilt, renormalised.
            v = fill * 2 - 1
            v /= np.maximum(np.linalg.norm(v, axis=2, keepdims=True), 1e-4)
            fill = v * 0.5 + 0.5
        mask = np.zeros(region.shape[:2], dtype=np.float32)
        mask[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = 1.0
        mask = np.clip(blur(mask, max(2, r // 3)) * 1.6, 0, 1)[..., None]
        a[Y0:Y1, X0:X1, :3] = region * (1 - mask) + fill * mask
    return a


def save(a, name, size, srgb):
    """Writes the array as a JPEG (scaled to size) and returns the Blender image."""
    h = a.shape[0]
    img = bpy.data.images.new(name, h, h, alpha=False, float_buffer=False)
    img.colorspace_settings.name = 'sRGB' if srgb else 'Non-Color'
    flat = np.ascontiguousarray(a[::-1]).reshape(-1)
    img.pixels.foreach_set(flat)
    if size != h:
        img.scale(size, size)
    img.filepath_raw = os.path.join(TMP, f'{name}.jpg')
    img.file_format = 'JPEG'
    img.save(quality=86)
    img.colorspace_settings.name = 'sRGB' if srgb else 'Non-Color'
    return img


def textures(kind, folder, prefix, size):
    path = lambda m: os.path.join(TEX, folder, f'{prefix}_{m}.png')
    boxes = STAMPS[kind]
    base = clean(load(path('Base color'), WORK), boxes, False)
    ao = clean(load(path('AO'), WORK), boxes, False)
    normal = clean(load(path('Normal map'), WORK), boxes, True)
    rough = clean(load(path('Roughness'), WORK), boxes, False)
    metal = clean(load(path('Metallic'), WORK), boxes, False)
    # Ambient occlusion baked into the base color (sRGB values, multiplied like a darkening layer).
    occ = 1 - AO_STRENGTH * (1 - ao[..., :1])
    base[..., :3] *= occ
    packed = np.zeros_like(base)
    packed[..., 0] = 1.0
    packed[..., 1] = rough[..., 0]
    packed[..., 2] = metal[..., 0]
    packed[..., 3] = 1.0
    base[..., 3] = 1.0
    normal[..., 3] = 1.0
    return (save(base, f'{kind}_base', size, True), save(normal, f'{kind}_normal', size, False),
            save(packed, f'{kind}_metal_rough', size, False))


def material(name, maps):
    base, normal, packed = maps
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = base
    nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
    n = nt.nodes.new('ShaderNodeTexImage')
    n.image = normal
    nmap = nt.nodes.new('ShaderNodeNormalMap')
    nt.links.new(n.outputs['Color'], nmap.inputs['Color'])
    nt.links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
    p = nt.nodes.new('ShaderNodeTexImage')
    p.image = packed
    sep = nt.nodes.new('ShaderNodeSeparateColor')
    nt.links.new(p.outputs['Color'], sep.inputs['Color'])
    nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
    nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
    return mat


# ---------------------------------------------------------------- mesh

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=FBX)
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH' or o.name in HIDDEN:
        bpy.data.objects.remove(o)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
print('PARTS', len(meshes), 'TRIS', sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes))

gun_mat = material('A3500X', textures('gun', 'A3500X black', 'A3500X_black', TEX_SIZE))
mag_mat = material('A3500X_Magazine', textures('magazine', 'magazine', 'magazine', MAG_TEX_SIZE))
for o in meshes:
    for slot in o.material_slots:
        is_mag = slot.material is not None and slot.material.name.startswith('magazine')
        slot.material = mag_mat if is_mag else gun_mat

bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.join()
gun = bpy.context.view_layer.objects.active
gun.name = 'A3500X'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
# Merge the duplicate materials the join left behind.
mats = []
for slot in gun.material_slots:
    if slot.material not in mats:
        mats.append(slot.material)
if len(mats) != len(gun.material_slots):
    remap = [mats.index(s.material) for s in gun.material_slots]
    target = [remap[p.material_index] for p in gun.data.polygons]
    gun.data.materials.clear()  # resets the polygon indices, so they are set again afterwards
    for m in mats:
        gun.data.materials.append(m)
    for p, i in zip(gun.data.polygons, target):
        p.material_index = i

tris = sum(len(p.vertices) - 2 for p in gun.data.polygons)
dec = gun.modifiers.new('Decimate', 'DECIMATE')
dec.ratio = min(1.0, TARGET_TRIS / tris)
dec.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier='Decimate')
after = sum(len(p.vertices) - 2 for p in gun.data.polygons)
print(f'DECIMATED {tris} -> {after}')

# Source axes: muzzle towards -Y, up +Z (glTF export: -Y -> +Z, +Z -> +Y).
co = np.array([v.co[:] for v in gun.data.vertices])
ymin, ymax = co[:, 1].min(), co[:, 1].max()
scale = LENGTH / (ymax - ymin)
# Grip point: middle of the grip's height below the slide, centred in the grip's cross section at that height.
zmin = co[:, 2].min()
grip_top = 0.687  # underside of the slide (frame top) in source units
zc = (zmin + grip_top) * 0.5
behind = co[:, 1] > 0.5  # the grip is the rear half of the frame
band = co[behind & (np.abs(co[:, 2] - zc) < 0.12)]
grip = Vector((0.0, (band[:, 1].min() + band[:, 1].max()) * 0.5, zc))
# Muzzle: the barrel's front end, on the bore axis.
front = co[co[:, 1] < ymin + 0.02]
bore = co[(co[:, 1] < ymin + 0.4) & (np.abs(co[:, 0]) < 0.14) & (co[:, 2] > 1.1) & (co[:, 2] < 1.39)]
muzzle = Vector((0.0, ymin, (bore[:, 2].min() + bore[:, 2].max()) * 0.5 if len(bore) else front[:, 2].mean()))
print('GRIP', tuple(round(x, 3) for x in grip), 'MUZZLE', tuple(round(x, 3) for x in muzzle), 'SCALE', round(scale, 4))
gun.data.transform(Matrix.Scale(scale, 4) @ Matrix.Translation(-grip))
gun.data.update()

empty = bpy.data.objects.new('Muzzle', None)
empty.location = (muzzle - grip) * scale
bpy.context.scene.collection.objects.link(empty)

bpy.ops.object.select_all(action='DESELECT')
gun.select_set(True)
empty.select_set(True)
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    use_selection=True,
    export_image_format='JPEG',
    export_jpeg_quality=86,
    export_yup=True,
    export_apply=True,
    export_animations=False,
    export_tangents=False,
)
print('EXPORTED', OUT, os.path.getsize(OUT), 'bytes,', after, 'triangles')
