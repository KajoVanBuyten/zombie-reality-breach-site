"""Exports the game's Desert Eagle as the golden web-quest weapon (public/breach/golden_deagle.glb), headless, without Unity.

Call (from the site repo):
  "<blender.exe>" -b --factory-startup --python scripts/export_golden_deagle.py -- <DesertEagle.fbx> public/breach/golden_deagle.glb

Source is Assets/_Project/Art/Weapons/DesertEagle/DesertEagle.fbx of the Unity project. The three meshes stay separate
nodes (Body, SlideVisual, MagazineVisual) because the quest scatters them as the three golden parts. Every material becomes
gold PBR (base #d4a73a, metallic 1, roughness 0.25) and keeps the game's normal map, scaled to 512 px and stored as JPEG to
keep the file small. The orange crack glow is added at runtime (src/breach/), not baked here. The Muzzle empty is exported
as a node so the page can place the muzzle flash. glTF is +Y up; the muzzle points to +Z, the grip point is the origin.
"""
import os
import sys

import bpy

argv = sys.argv[sys.argv.index('--') + 1:]
FBX, OUT = argv[0], argv[1]
TEX_DIR = os.path.dirname(FBX)
NORMAL_SIZE = 512
GOLD = (0.658, 0.386, 0.044, 1.0)  # #d4a73a in linear space

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=FBX)


def gold_material(name):
    mat = bpy.data.materials.new(f'Gold_{name}')
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = GOLD
    bsdf.inputs['Metallic'].default_value = 1.0
    bsdf.inputs['Roughness'].default_value = 0.25
    path = os.path.join(TEX_DIR, f'DesertEagle_{name}_Normal.png')
    if os.path.exists(path):
        img = bpy.data.images.load(path)
        img.scale(NORMAL_SIZE, NORMAL_SIZE)
        img.colorspace_settings.name = 'Non-Color'
        tex = nodes.new('ShaderNodeTexImage')
        tex.image = img
        nmap = nodes.new('ShaderNodeNormalMap')
        mat.node_tree.links.new(tex.outputs['Color'], nmap.inputs['Color'])
        mat.node_tree.links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


golds = {}
keep = []
for obj in list(bpy.context.scene.objects):
    if obj.type == 'MESH':
        for slot in obj.material_slots:
            base = slot.material.name.split('.')[0] if slot.material else 'MainBody'
            if base not in golds:
                golds[base] = gold_material(base)
            slot.material = golds[base]
        keep.append(obj)
    elif obj.name == 'Muzzle':
        keep.append(obj)

bpy.ops.object.select_all(action='DESELECT')
for obj in keep:
    obj.select_set(True)
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    use_selection=True,
    export_image_format='JPEG',
    export_jpeg_quality=88,
    export_yup=True,
    export_apply=True,
    export_animations=False,
)
print('EXPORTED', OUT, os.path.getsize(OUT))
