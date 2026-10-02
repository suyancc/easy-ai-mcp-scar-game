# kit_factory.py v5 — Kenney 成品模型整合（整组矩阵变换）
import bpy, math, os
from mathutils import Vector, Matrix

KIT = 'D:/code/python/wechat-win-client/models/kit'
OUT = 'D:/code/python/wechat-win-client/game/assets'
SHOT = 'D:/code/python/wechat-win-client'

# ---------- 工具 ----------
def purge():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)

def import_glb(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    for o in list(new):
        if '%ignore' in o.name.lower():   # Kenney 的引导平面，必须剔除
            bpy.data.objects.remove(o, do_unlink=True)
            new.remove(o)
    bpy.context.view_layer.update()
    return new

def measure(objs):
    xs, ys, zs = [], [], []
    for o in objs:
        for c in o.bound_box:
            v = o.matrix_world @ Vector(c)
            xs.append(v.x); ys.append(v.y); zs.append(v.z)
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)

def group_info(objs):
    x0, x1, y0, y1, z0, z1 = measure(objs)
    return dict(w=x1 - x0, d=y1 - y0, h=z1 - z0, cx=(x0 + x1) / 2, cy=(y0 + y1) / 2, z0=z0)

def group_transform(objs, scale=1.0, rot_z=None, move=(0, 0, 0)):
    """整组绕 bbox 竖直轴缩放/旋转，再把 底面中心 对齐到 move"""
    x0, x1, y0, y1, z0, z1 = measure(objs)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    R = Matrix.Rotation(rot_z or 0.0, 4, 'Z')
    S = Matrix.Diagonal((scale, scale, scale, 1.0))
    M = (Matrix.Translation((cx, cy, 0)) @ R @ S @ Matrix.Translation((-cx, -cy, 0)))
    for o in objs:
        o.matrix_world = M @ o.matrix_world
    bpy.context.view_layer.update()
    x0, x1, y0, y1, z0, z1 = measure(objs)
    corr = Matrix.Translation((move[0] - (x0 + x1) / 2, move[1] - (y0 + y1) / 2, move[2] - z0))
    for o in objs:
        o.matrix_world = corr @ o.matrix_world
    bpy.context.view_layer.update()

def join_all(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    root = bpy.context.view_layer.objects.active
    root.name = name
    if root.data:
        root.data.name = name
    group_transform([root], scale=1.0, rot_z=None, move=(0, 0, 0))  # 根原点归中
    return root

def export_glb(obj, path):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    try:
        bpy.ops.export_scene.gltf(filepath=path, use_selection=True, export_apply=True,
                                  export_lights=False, export_cameras=False, export_yup=True)
    except TypeError:
        bpy.ops.export_scene.gltf(filepath=path, use_selection=True, export_apply=True)
    print('GLB_OK', os.path.basename(path), os.path.getsize(path))

# ---------- 渲染 ----------
def setup_render():
    sc = bpy.context.scene
    try:
        sc.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception:
        try:
            sc.render.engine = 'BLENDER_EEVEE'
        except Exception:
            pass
    sc.render.resolution_x = 640
    sc.render.resolution_y = 400
    sc.render.resolution_percentage = 100
    if not sc.world:
        sc.world = bpy.data.worlds.new('W')
    sc.world.use_nodes = True
    nt = sc.world.node_tree
    bg = next((n for n in nt.nodes if n.bl_idname == 'ShaderNodeBackground'), None)
    if bg is None:
        bg = nt.nodes.new('ShaderNodeBackground')
        out = next((n for n in nt.nodes if n.bl_idname == 'ShaderNodeOutputWorld'), None) or nt.nodes.new('ShaderNodeOutputWorld')
        nt.links.new(bg.outputs[0], out.inputs[0])
    bg.inputs[0].default_value = (0.72, 0.83, 0.95, 1.0)
    bg.inputs[1].default_value = 1.0
    sun = bpy.data.lights.new('S', 'SUN')
    sun.energy = 3.5
    so = bpy.data.objects.new('S', sun)
    so.rotation_euler = (math.radians(50), 0, math.radians(-30))
    bpy.context.collection.objects.link(so)

def render(path, loc, target, lens=38):
    cam = bpy.data.cameras.new('C')
    cam.lens = lens
    co = bpy.data.objects.new('C', cam)
    bpy.context.collection.objects.link(co)
    co.location = loc
    d = Vector(target) - Vector(loc)
    co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = co
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print('RENDER_OK', os.path.basename(path), os.path.getsize(path))

# ---------- 主流程 ----------
purge()
setup_render()

CARS = [
    ('hatchback-sports', 4.3, 'cyber_car'),
    ('garbage-truck', 5.6, 'enemy_truck'),
    ('tractor-shovel', 5.0, 'enemy_rammer'),
    ('kart-oobi', 3.4, 'enemy_buggy'),
]

def wheel_y(objs, key):
    vals = []
    for o in objs:
        if key in o.name.lower():
            ys = [(o.matrix_world @ Vector(c)).y for c in o.bound_box]
            vals.append(sum(ys) / 8)
    return sum(vals) / len(vals) if vals else None

roots = {}
for fname, target_len, outname in CARS:
    objs = import_glb(os.path.join(KIT, 'cars', fname + '.glb'))
    info = group_info(objs)
    fy = wheel_y(objs, 'wheel-front')
    by = wheel_y(objs, 'wheel-back')
    rot = 0.0
    if fy is not None and by is not None and fy > by:
        rot = math.pi  # 车头须朝 Blender -Y（= glTF +z）
    print('CAR', fname, 'w=%.2f d=%.2f h=%.2f' % (info['w'], info['d'], info['h']),
          'fy=%s by=%s rot=%d' % (fy, by, int(math.degrees(rot))))
    s = target_len / max(info['w'], info['d'])
    group_transform(objs, scale=s, rot_z=rot, move=(0, 0, 0))
    root = join_all(objs, outname)
    roots[outname] = root

# ---------- 拼楼 ----------
M = 2.0; WT = 0.2; WALLH = 2.4; FLOORTH = 0.1

piece_names = {}
for n in ['wall-window-wide-round', 'wall-window-round', 'wall-window-square',
          'wall-doorway-wide-round', 'floor', 'roof-flat-center', 'border']:
    o = import_glb(os.path.join(KIT, 'pieces', n + '.glb'))
    piece_names[n] = (o, group_info(o))
    for ob in o:
        ob.location.x += 500  # 模板挪远
print('PIECES_READY')

def spawn(name, loc, rot_z=0.0):
    objs, info = piece_names[name]
    new = []
    for src in objs:
        c = src.copy()
        if src.data:
            c.data = src.data.copy()
        bpy.context.collection.objects.link(c)
        new.append(c)
    group_transform(new, scale=1.0, rot_z=rot_z, move=loc)
    return new

def build_house(outname, nx2, nz2, floors, target_h, door=True):
    parts = []
    Wx, Wy = nx2 * M, nz2 * M
    zs = 0.0
    for f in range(floors):
        for i in range(nx2):
            for j in range(nz2):
                parts += spawn('floor', ((i - (nx2 - 1) / 2) * M, (j - (nz2 - 1) / 2) * M, zs))
        zs += FLOORTH
        nfx = max(1, int(round(Wx / 4.0)))
        nsy = max(1, int(round(Wy / 4.0)))
        for i in range(nfx):
            x = (i - (nfx - 1) / 2) * 4.0
            for side, y in (('back', Wy / 2 - WT / 2), ('front', -(Wy / 2 - WT / 2))):
                nm = 'wall-window-wide-round'
                if f == 0 and door and side == 'front' and i == nfx // 2:
                    nm = 'wall-doorway-wide-round'
                parts += spawn(nm, (x, y, zs), rot_z=math.radians(90))
        for j in range(nsy):
            y = (j - (nsy - 1) / 2) * 4.0
            for x in (-(Wx / 2 - WT / 2), Wx / 2 - WT / 2):
                parts += spawn('wall-window-wide-round', (x, y, zs))
        zs += WALLH
    for i in range(nx2):
        for j in range(nz2):
            parts += spawn('roof-flat-center', ((i - (nx2 - 1) / 2) * M, (j - (nz2 - 1) / 2) * M, zs))
    zs += FLOORTH
    for i in range(nx2):
        x = (i - (nx2 - 1) / 2) * M
        parts += spawn('border', (x, -(Wy / 2 + 0.1), zs), rot_z=math.radians(90))
        parts += spawn('border', (x, Wy / 2 + 0.1, zs), rot_z=math.radians(90))
    for j in range(nz2):
        y = (j - (nz2 - 1) / 2) * M
        parts += spawn('border', (-(Wx / 2 + 0.1), y, zs))
        parts += spawn('border', (Wx / 2 + 0.1, y, zs))
    group_transform(parts, scale=target_h / group_info(parts)['h'], rot_z=None, move=(0, 0, 0))
    root = join_all(parts, outname)
    return root

b1 = build_house('scenery_building_1', 4, 4, 5, 22.0)
b2 = build_house('scenery_building_2', 6, 4, 3, 15.0)
b3 = build_house('scenery_building_3', 4, 2, 2, 9.5)

# ---------- 障碍物（道路包成品：垃圾箱/施工护栏/施工锥） ----------
OBST = [
    ('dumpster', 'len', 2.6, 'obs_barrel'),
    ('construction-barrier', 'len', 3.0, 'obs_caltrops'),
    ('construction-cone', 'h', 1.35, 'obs_explosive'),
]
for fname, mode, target, outname in OBST:
    objs = import_glb(os.path.join(KIT, 'pieces', fname + '.glb'))
    info = group_info(objs)
    base = max(info['w'], info['d']) if mode == 'len' else info['h']
    s = target / max(base, 0.001)
    group_transform(objs, scale=s, rot_z=0.0, move=(0, 0, 0))
    root = join_all(objs, outname)
    roots[outname] = root
    print('OBST', fname, '->', outname, 's=%.2f' % s)

# ---------- 导出 ----------
os.makedirs(OUT, exist_ok=True)
for name, root in roots.items():
    export_glb(root, os.path.join(OUT, name + '.glb'))
for b in (b1, b2, b3):
    export_glb(b, os.path.join(OUT, b.name + '.glb'))

# ---------- 校验渲染 ----------
b1.location = (-26, 40, 0); b2.location = (0, 48, 0); b3.location = (24, 38, 0)
order = ['cyber_car', 'enemy_truck', 'enemy_rammer', 'enemy_buggy']
xs = [-9, -3, 3, 9]
for name, x in zip(order, xs):
    roots[name].location = (x, 0, 0)
roots['obs_barrel'].location = (-14, 0, 0)
roots['obs_caltrops'].location = (-21, 0, 0)
roots['obs_explosive'].location = (-28, 0, 0)
render(os.path.join(SHOT, 'kit_cars.jpg'), (-8, 13, 4.5), (-8, -2, 1.2), 42)
render(os.path.join(SHOT, 'kit_obs.jpg'), (-21, 7, 3), (-21, 0, 0.8), 40)
render(os.path.join(SHOT, 'kit_buildings.jpg'), (-10, -22, 9), (2, 30, 9), 30)

print('FACTORY_DONE')
