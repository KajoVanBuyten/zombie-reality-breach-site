"""Exports the game's Tripo zombies for the web AR quest (public/breach/zombies/*.glb), headless, without Unity.

Call (from the site repo):
  "<blender.exe>" -b --factory-startup --python scripts/export_zombies.py -- <Tripo dir> <animation FBX> <out dir> [F_Zombie_XX ...]

<Tripo dir> is Assets/_Project/Art/Zombie/Tripo of the Unity project (one folder per model with F_Zombie_XX.fbx and
Textures/), <animation FBX> is Assets/_Project/Animations/TripoSource/F_Zombie_16_Animations.fbx: the owner's Tripo takes on
the F_Zombie_16 rig. Only Tripo models and Tripo takes go into the files (no Mixamo or store assets: the site may not
redistribute those).

All Tripo models share the 67 bone names, but each has its own rest pose. The takes are retargeted per model: every bone
gets the source's parent-relative rotation (q_target = rest_target^-1 * rest_source * q_source), so the limbs move as in
the take; only the hips keep a translation, scaled to the model's hip height. Loops lose their horizontal drift (they are
in place, the page moves the zombie), hits and deaths keep it. The mesh is decimated to about TARGET_TRIS triangles,
scaled so the head sits at HEAD_HEIGHT m, base color 1024 px and normal 512 px as JPEG, no metallic map (metallic 0,
roughness 0.85). glTF is +Y up; the zombies face +Z, the feet are at the origin. Clip names follow
Scripts/Editor/TripoAnimationLibrary.cs of the game.
"""
import math
import os
import sys
import tempfile

import bpy
from mathutils import Quaternion, Vector

argv = sys.argv[sys.argv.index('--') + 1:]
TRIPO, ANIM_FBX, OUT = argv[0], argv[1], argv[2]
MODELS = argv[3:] or ['F_Zombie_01', 'F_Zombie_06', 'F_Zombie_10', 'F_Zombie_16']
TARGET_TRIS = 7500
HEAD_HEIGHT = 1.58
BASE_SIZE = 1024
NORMAL_SIZE = 512

# Clip name -> (start of the Tripo prompt, loop). The heavy walk is only exported for the model the finale uses.
CLIPS = {
    'Walk_Hunched': ('a hunched zombie walks forward in place', True),
    'Walk_Stagger': ('a drunk-like zombie staggers', True),
    'Run_Lope': ('a zombie runs forward in place in an awkward', True),
    'Idle_Breathe': ('a hunched zombie stands in place breathing', True),
    'Hit_Chest': ('a zombie is hit in the chest', False),
    'Hit_Head': ("a zombie's head snaps backward", False),
    'Death_Forward': ('a zombie collapses forward', False),
    'Death_Back': ('a zombie is shot, its head snaps back', False),
}
HEAVY = ('Walk_Heavy', ('a huge heavy zombie walks forward in place', True))
HEAVY_MODEL = 'F_Zombie_16'


def armature_and_mesh(objects):
    arm = next(o for o in objects if o.type == 'ARMATURE')
    mesh = next(o for o in objects if o.type == 'MESH')
    return arm, mesh


def import_fbx(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path)
    return [o for o in bpy.data.objects if o not in before]


def rest_relative(arm):
    """Parent-relative rest rotation and armature-space rest matrix per bone."""
    rel = {}
    for b in arm.data.bones:
        m = b.matrix_local if b.parent is None else b.parent.matrix_local.inverted() @ b.matrix_local
        rel[b.name] = m.to_quaternion()
    return rel


def find_action(prompt):
    for a in bpy.data.actions:
        name = a.name.split('|', 1)[-1].strip().lower()
        if name.startswith(prompt):
            return a
    raise RuntimeError(f'no take for "{prompt}"')


def curves(action):
    out = {}
    for fc in action.fcurves:
        out[(fc.data_path, fc.array_index)] = fc
    return out


def retarget(name, src_action, loop, src_arm, dst_arm):
    src_rel, dst_rel = rest_relative(src_arm), rest_relative(dst_arm)
    fcs = curves(src_action)
    f0, f1 = (int(round(f)) for f in src_action.frame_range)
    frames = list(range(f0, f1 + 1))

    def quat(bone, f):
        path = f'pose.bones["{bone}"].rotation_quaternion'
        if (path, 0) not in fcs:
            return Quaternion()
        return Quaternion([fcs[(path, i)].evaluate(f) if (path, i) in fcs else (1.0 if i == 0 else 0.0) for i in range(4)])

    def hips_loc(f):
        path = 'pose.bones["Hips"].location'
        return Vector([fcs[(path, i)].evaluate(f) if (path, i) in fcs else 0.0 for i in range(3)])

    # A loop whose last frame repeats the first drops it, so the cycle has no double frame.
    if loop:
        same = all(quat(b.name, f0).rotation_difference(quat(b.name, f1)).angle < 0.02 for b in src_arm.data.bones)
        if same:
            frames = frames[:-1]

    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    dst_arm.animation_data_create()
    dst_arm.animation_data.action = action

    def write(path, index, values, group):
        fc = action.fcurves.new(path, index=index, action_group=group)
        fc.keyframe_points.add(len(values))
        co = []
        for f, v in zip(frames, values):
            co += [f - frames[0] + 1, v]
        fc.keyframe_points.foreach_set('co', co)
        for k in fc.keyframe_points:
            k.interpolation = 'LINEAR'
        fc.update()

    for bone in dst_arm.data.bones:
        if bone.name not in src_rel:
            continue
        fix = dst_rel[bone.name].inverted() @ src_rel[bone.name]
        values = []
        prev = None
        for f in frames:
            q = fix @ quat(bone.name, f)
            q.normalize()
            if prev is not None and prev.dot(q) < 0:
                q.negate()
            values.append(q)
            prev = q
        if all(v.rotation_difference(values[0]).angle < 1e-4 for v in values) and values[0].angle < 1e-4:
            continue
        path = f'pose.bones["{bone.name}"].rotation_quaternion'
        for i in range(4):
            write(path, i, [v[i] for v in values], bone.name)

    # Hips: armature-space position of the source, mapped to the target's hip height.
    sb, db = src_arm.data.bones['Hips'], dst_arm.data.bones['Hips']
    k = db.head_local.z / sb.head_local.z
    s_rot, d_rot = sb.matrix_local.to_3x3(), db.matrix_local.to_3x3().inverted()
    pos = [sb.head_local + s_rot @ hips_loc(f) for f in frames]
    if loop and len(pos) > 1:
        # Remove the travel over the cycle (start to end) but keep the sway.
        drift = pos[-1] - pos[0]
        drift.z = 0
        n = len(pos)
        pos = [p - drift * (i / n) for i, p in enumerate(pos)]
        mean = sum((p for p in pos), Vector()) / n
        pos = [Vector((p.x - mean.x + sb.head_local.x, p.y - mean.y + sb.head_local.y, p.z)) for p in pos]
    locs = []
    for p in pos:
        t = Vector(((p.x - sb.head_local.x) * k + db.head_local.x, (p.y - sb.head_local.y) * k + db.head_local.y, p.z * k))
        locs.append(d_rot @ (t - db.head_local))
    for i in range(3):
        write('pose.bones["Hips"].location', i, [v[i] for v in locs], 'Hips')
    travel = (pos[-1] - pos[0]).xy.length
    print(f'  CLIP {name}: {len(frames)} frames, travel after fix {travel:.3f}')
    dst_arm.animation_data.action = None
    return action


TMP = tempfile.mkdtemp(prefix='zrb_zombies_')


def scaled(path, size, color):
    """Loads a texture, scales it and saves it as JPEG in a temp folder (the exporter would copy the full-size file)."""
    img = bpy.data.images.load(path)
    img.scale(size, size)
    img.filepath_raw = os.path.join(TMP, f'{size}_' + os.path.basename(path))
    img.file_format = 'JPEG'
    img.save(quality=82)
    if not color:
        img.colorspace_settings.name = 'Non-Color'
    return img


def material(model):
    tex = os.path.join(TRIPO, model, 'Textures')
    mat = bpy.data.materials.new(f'{model}_Mat')
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes['Principled BSDF']
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = 0.85
    base = scaled(os.path.join(tex, f'{model}_BaseColor.jpg'), BASE_SIZE, True)
    t = nodes.new('ShaderNodeTexImage')
    t.image = base
    mat.node_tree.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
    normal = scaled(os.path.join(tex, f'{model}_Normal.jpg'), NORMAL_SIZE, False)
    n = nodes.new('ShaderNodeTexImage')
    n.image = normal
    nmap = nodes.new('ShaderNodeNormalMap')
    mat.node_tree.links.new(n.outputs['Color'], nmap.inputs['Color'])
    mat.node_tree.links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


def export(model):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    src_arm, src_mesh = armature_and_mesh(import_fbx(ANIM_FBX))
    bpy.data.objects.remove(src_mesh)
    src_arm.name = 'Source'
    takes = [a for a in bpy.data.actions]
    dst_arm, dst_mesh = armature_and_mesh(import_fbx(os.path.join(TRIPO, model, f'{model}.fbx')))
    for a in list(bpy.data.actions):
        if a not in takes:
            bpy.data.actions.remove(a)
    if dst_arm.animation_data:
        dst_arm.animation_data.action = None
    src_names = {b.name for b in src_arm.data.bones}
    dst_names = {b.name for b in dst_arm.data.bones}
    if src_names != dst_names:
        raise RuntimeError(f'{model}: bone names differ from the take rig: {sorted(src_names ^ dst_names)}')
    print('MODEL', model)

    # Scale to meters (head at HEAD_HEIGHT) and apply, so bone rests and hips keys are in meters.
    scale = HEAD_HEIGHT / dst_arm.data.bones['Head'].head_local.z
    bpy.ops.object.select_all(action='DESELECT')
    dst_arm.scale = (scale, scale, scale)
    dst_arm.select_set(True)
    dst_mesh.select_set(True)
    bpy.context.view_layer.objects.active = dst_arm
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # Decimate (vertex groups survive the collapse).
    tris = sum(len(p.vertices) - 2 for p in dst_mesh.data.polygons)
    dec = dst_mesh.modifiers.new('Decimate', 'DECIMATE')
    dec.ratio = min(1.0, TARGET_TRIS / tris)
    dec.use_collapse_triangulate = True
    bpy.context.view_layer.objects.active = dst_mesh
    # The armature modifier must stay last: move the decimate to the top, then apply it.
    bpy.ops.object.modifier_move_to_index(modifier='Decimate', index=0)
    bpy.ops.object.modifier_apply(modifier='Decimate')
    after = sum(len(p.vertices) - 2 for p in dst_mesh.data.polygons)
    print(f'  TRIS {tris} -> {after}, scale {scale:.3f}')

    dst_mesh.data.materials.clear()
    dst_mesh.data.materials.append(material(model))
    dst_mesh.name = model
    dst_arm.name = f'{model}_Rig'

    clips = dict(CLIPS)
    if model == HEAVY_MODEL:
        clips[HEAVY[0]] = HEAVY[1]
    made = []
    for name, (prompt, loop) in clips.items():
        made.append(retarget(name, find_action(prompt), loop, src_arm, dst_arm))
    for a in takes:
        bpy.data.actions.remove(a)
    bpy.data.objects.remove(src_arm)
    # One NLA track per clip, so the exporter writes each as its own animation.
    for action in made:
        track = dst_arm.animation_data.nla_tracks.new()
        track.name = action.name
        track.strips.new(action.name, 1, action)
        track.mute = True

    bpy.ops.object.select_all(action='DESELECT')
    dst_arm.select_set(True)
    dst_mesh.select_set(True)
    out = os.path.join(OUT, f'{model.lower()}.glb')
    os.makedirs(OUT, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format='GLB',
        use_selection=True,
        export_image_format='JPEG',
        export_jpeg_quality=82,
        export_yup=True,
        export_apply=True,
        export_animations=True,
        export_animation_mode='NLA_TRACKS',
        export_force_sampling=True,
        export_optimize_animation_size=True,
        export_def_bones=True,
        export_skins=True,
        export_morph=False,
        export_tangents=False,
    )
    print(f'EXPORTED {out} {os.path.getsize(out)} bytes')


for m in MODELS:
    export(m)
