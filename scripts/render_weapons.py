"""Rendert Produktbilder der Waffen- und Mod-Modelle des Spiels mit Blender (headless), ohne Unity.

Aufruf (aus dem Site-Repo):
  "<blender.exe>" -b --factory-startup --python scripts/render_weapons.py -- scripts/weapon_renders.json <Ausgabeordner> [name ...]

Quelle sind die FBX-Dateien unter Assets/_Project/Art des Unity-Projekts (weapon_renders.json: "art_root").
Je Eintrag: FBX laden, Texturen nach dem Namensschema <Prefix>_<Material>_{BaseColor,Normal,MetallicSmoothness}.png
oder aus "textures"/"colors" der Konfiguration zuweisen, Modell auf 1 m normieren, Kamera schräg von der Seite
(Mündung nach rechts) automatisch einpassen, Dreipunktlicht, transparenter Hintergrund, PNG RGBA.

Das Katana liegt als FBX 6100 (Binär) vor, das Blenders Importer ablehnt; es wird über Blenders eigenen
Low-Level-Parser gelesen und als Mesh gebaut ("builder": "fbx6100").
"""
import json
import math
import os
import re
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
CONFIG, OUT = argv[0], argv[1]
ONLY = set(argv[2:])
cfg = json.load(open(CONFIG, encoding='utf-8'))
ART = cfg['art_root']
RES = cfg.get('resolution', [1600, 900])
SAMPLES = cfg.get('samples', 64)
os.makedirs(OUT, exist_ok=True)


def art(path):
    return path if os.path.isabs(path) else os.path.join(ART, path)


def sanitize(name):
    return re.sub(r'[^A-Za-z0-9]', '_', name)


# ----------------------------------------------------------------------------- Import
def import_fbx(path):
    bpy.ops.import_scene.fbx(filepath=path)


def build_fbx6100(path):
    """Builds meshes from a binary FBX 6100 file via io_scene_fbx.parse_fbx (vertices, polygons, UVs)."""
    from io_scene_fbx import parse_fbx
    root, version = parse_fbx.parse(path)

    def find(elem, name):
        return [e for e in elem.elems if e.id == name.encode()]

    objects = find(root, 'Objects')[0]
    materials = [m.props[0].split(b'\x00')[0].decode() for m in find(objects, 'Material')]
    for model in find(objects, 'Model'):
        if model.props[1] != b'Mesh':
            continue
        name = model.props[0].split(b'\x00')[0].decode()
        verts_flat = [float(v) for v in find(model, 'Vertices')[0].props]
        verts = [tuple(verts_flat[i:i + 3]) for i in range(0, len(verts_flat), 3)]
        idx = [int(i) for i in find(model, 'PolygonVertexIndex')[0].props]
        faces, face = [], []
        for i in idx:
            if i < 0:
                face.append(-i - 1)
                faces.append(face)
                face = []
            else:
                face.append(i)
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(verts, [], faces)
        uv_layers = find(model, 'LayerElementUV')
        if uv_layers:
            uv_elem = uv_layers[0]
            uv_flat = [float(v) for v in find(uv_elem, 'UV')[0].props]
            uvs = [(uv_flat[i], uv_flat[i + 1]) for i in range(0, len(uv_flat), 2)]
            uv_index = find(uv_elem, 'UVIndex')
            per_loop = [int(i) for i in uv_index[0].props] if uv_index else list(range(len(uvs)))
            layer = mesh.uv_layers.new(name='UVMap')
            for li, loop in enumerate(mesh.loops):
                layer.data[li].uv = uvs[per_loop[li]] if li < len(per_loop) else (0.0, 0.0)
        mat_name = materials[0] if materials else name
        mat = bpy.data.materials.get(mat_name) or bpy.data.materials.new(mat_name)
        mesh.materials.append(mat)
        mesh.validate()
        mesh.update()
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        for poly in mesh.polygons:
            poly.use_smooth = True


# ----------------------------------------------------------------------------- Materials
def find_texture(folder, prefix, mat, suffix):
    for m in (mat, sanitize(mat)):
        p = os.path.join(folder, '%s_%s_%s.png' % (prefix, m, suffix))
        if os.path.exists(p):
            return p
    return None


def image(path, non_color=False):
    img = bpy.data.images.load(path, check_existing=True)
    if non_color:
        img.colorspace_settings.name = 'Non-Color'
    return img


def setup_material(mat, item, folder, prefix):
    tex_cfg = item.get('textures', {})
    spec = tex_cfg.get(mat.name) or tex_cfg.get(sanitize(mat.name)) or tex_cfg.get('*') or {}
    base = art(spec['base']) if 'base' in spec else find_texture(folder, prefix, mat.name, 'BaseColor')
    normal = art(spec['normal']) if 'normal' in spec else find_texture(folder, prefix, mat.name, 'Normal')
    metsmooth = art(spec['metsmooth']) if 'metsmooth' in spec else find_texture(folder, prefix, mat.name, 'MetallicSmoothness')
    metallic = art(spec['metallic']) if 'metallic' in spec else None
    roughness = art(spec['roughness']) if 'roughness' in spec else None
    colors = item.get('colors', {})
    flat = colors.get(mat.name) or colors.get(sanitize(mat.name))

    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Roughness'].default_value = 0.5
    bsdf.inputs['Metallic'].default_value = 0.0

    if base:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = image(base)
        nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
        if item.get('alpha_clip') and mat.name in item['alpha_clip']:
            nt.links.new(t.outputs['Alpha'], bsdf.inputs['Alpha'])
            mat.surface_render_method = 'DITHERED'
    elif flat:
        r, g, b = flat[0], flat[1], flat[2]
        bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
    else:
        bsdf.inputs['Base Color'].default_value = (0.45, 0.45, 0.47, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.8
        bsdf.inputs['Roughness'].default_value = 0.45
    if flat and len(flat) >= 5:
        bsdf.inputs['Metallic'].default_value = flat[3]
        bsdf.inputs['Roughness'].default_value = flat[4]

    if normal:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = image(normal, non_color=True)
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nm.inputs['Strength'].default_value = 1.0
        nt.links.new(t.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])

    if metsmooth:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = image(metsmooth, non_color=True)
        sep = nt.nodes.new('ShaderNodeSeparateColor')
        nt.links.new(t.outputs['Color'], sep.inputs['Color'])
        nt.links.new(sep.outputs['Red'], bsdf.inputs['Metallic'])
        inv = nt.nodes.new('ShaderNodeMath')
        inv.operation = 'SUBTRACT'
        inv.inputs[0].default_value = 1.0
        nt.links.new(t.outputs['Alpha'], inv.inputs[1])
        nt.links.new(inv.outputs['Value'], bsdf.inputs['Roughness'])
    else:
        if metallic:
            t = nt.nodes.new('ShaderNodeTexImage')
            t.image = image(metallic, non_color=True)
            sep = nt.nodes.new('ShaderNodeSeparateColor')
            nt.links.new(t.outputs['Color'], sep.inputs['Color'])
            nt.links.new(sep.outputs['Red'], bsdf.inputs['Metallic'])
        if roughness:
            t = nt.nodes.new('ShaderNodeTexImage')
            t.image = image(roughness, non_color=True)
            sep = nt.nodes.new('ShaderNodeSeparateColor')
            nt.links.new(t.outputs['Color'], sep.inputs['Color'])
            nt.links.new(sep.outputs['Red'], bsdf.inputs['Roughness'])


# ----------------------------------------------------------------------------- Scene
def mesh_objects():
    return [o for o in bpy.data.objects if o.type == 'MESH']


def world_bounds(objects):
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for o in objects:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector((min(lo.x, w.x), min(lo.y, w.y), min(lo.z, w.z)))
            hi = Vector((max(hi.x, w.x), max(hi.y, w.y), max(hi.z, w.z)))
    return lo, hi


def add_light(name, kind, location, target, energy, size, color=(1, 1, 1)):
    data = bpy.data.lights.new(name, kind)
    data.energy = energy
    data.color = color
    if kind == 'AREA':
        data.size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (target - location).to_track_quat('-Z', 'Y').to_euler()
    return obj


def render_item(name, item):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    path = art(item['path'])
    if item.get('builder') == 'fbx6100':
        build_fbx6100(path)
    else:
        import_fbx(path)

    drop = item.get('drop', [])
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and any(d in o.name for d in drop):
            bpy.data.objects.remove(o, do_unlink=True)
    for o in list(bpy.data.objects):
        if o.type in ('EMPTY', 'ARMATURE', 'CAMERA', 'LIGHT') and not o.children:
            bpy.data.objects.remove(o, do_unlink=True)

    folder = os.path.dirname(path)
    prefix = item.get('prefix', os.path.splitext(os.path.basename(path))[0])
    used = set()
    for o in mesh_objects():
        for m in o.data.materials:
            if m:
                used.add(m)
    for m in used:
        setup_material(m, item, folder, prefix)

    # Everything under one rig: optional fix rotation, then uniform scale to 1 m, centred at the origin.
    rig = bpy.data.objects.new('Rig', None)
    scene.collection.objects.link(rig)
    for o in list(bpy.data.objects):
        if o.parent is None and o is not rig:
            o.parent = rig
    rot = item.get('rotate', [0, 0, 0])
    if item.get('upright'):
        rot = [rot[0] - 90, rot[1], rot[2]]
    rig.rotation_euler = [math.radians(a) for a in rot]
    bpy.context.view_layer.update()
    lo, hi = world_bounds(mesh_objects())
    size = max(hi - lo)
    rig.scale = (1.0 / size,) * 3
    bpy.context.view_layer.update()
    lo, hi = world_bounds(mesh_objects())
    centre = (lo + hi) / 2
    rig.location = -centre
    bpy.context.view_layer.update()
    lo, hi = world_bounds(mesh_objects())
    centre = (lo + hi) / 2
    radius = max(0.2, (hi - lo).length / 2)

    # Camera: from the -X side (muzzle = -Y points right), turned towards the muzzle and raised.
    yaw = math.radians(item.get('yaw', cfg.get('yaw', 28)))
    pitch = math.radians(item.get('pitch', cfg.get('pitch', 16)))
    d = Vector((-math.cos(yaw) * math.cos(pitch), -math.sin(yaw) * math.cos(pitch), math.sin(pitch)))
    cam_data = bpy.data.cameras.new('Camera')
    cam_data.lens = cfg.get('lens', 50)
    cam_data.sensor_width = 36
    cam = bpy.data.objects.new('Camera', cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.location = centre + d * radius * 4
    cam.rotation_euler = (centre - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.resolution_x, scene.render.resolution_y = RES
    scene.render.resolution_percentage = 100
    bpy.context.view_layer.update()
    coords = []
    for o in mesh_objects():
        mw = o.matrix_world
        for v in o.data.vertices:
            coords.extend(mw @ v.co)
    loc, _ = cam.camera_fit_coords(bpy.context.evaluated_depsgraph_get(), coords)
    margin = item.get('margin', cfg.get('margin', 1.08))
    cam.location = centre + (Vector(loc) - centre) * margin

    # Lights in camera space: key from the upper left, fill from the right, rim from behind.
    back = d
    right = back.cross(Vector((0, 0, 1))).normalized()
    up = right.cross(back).normalized()
    dist = radius * 3.5
    lights = cfg.get('lights', {})
    scale = radius ** 2 * 4 * item.get('light_scale', 1.0)
    add_light('Key', 'AREA', centre + (back * 0.9 - right * 0.9 + up * 1.1).normalized() * dist, centre, lights.get('key', 300) * scale, radius * 3.5, (1.0, 0.96, 0.9))
    add_light('Fill', 'AREA', centre + (back * 0.7 + right * 1.2 + up * 0.3).normalized() * dist, centre, lights.get('fill', 100) * scale, radius * 4.0, (0.85, 0.9, 1.0))
    add_light('Rim', 'AREA', centre + (-back * 1.0 + right * 0.3 + up * 1.2).normalized() * dist, centre, lights.get('rim', 400) * scale, radius * 2.0, (1.0, 1.0, 1.0))
    add_light('Under', 'AREA', centre + (back * 0.4 - up * 1.0).normalized() * dist, centre, lights.get('under', 40) * scale, radius * 4.0, (1.0, 0.95, 0.9))

    world = bpy.data.worlds.new('World')
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.35, 0.36, 0.4, 1.0)
    bg.inputs['Strength'].default_value = cfg.get('ambient', 0.35)

    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = SAMPLES
    scene.render.film_transparent = True
    scene.view_settings.view_transform = cfg.get('view_transform', 'Standard')
    scene.view_settings.look = 'None'
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True)
    print('RENDERED %s -> %s (size %.3f, %d meshes)' % (name, scene.render.filepath, size, len(mesh_objects())))


failed = []
for name, item in cfg['items'].items():
    if ONLY and name not in ONLY:
        continue
    try:
        render_item(name, item)
    except Exception as exc:  # keep going, report at the end
        import traceback
        traceback.print_exc()
        failed.append((name, str(exc)))
if failed:
    print('FAILED', failed)
    sys.exit(1)
