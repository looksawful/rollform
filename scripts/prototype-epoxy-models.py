"""ROLLFORM epoxy shape study: beveled faces with genuinely recessed lettering.
Source: existing CC0-free in-house site meshes, not the uploaded manufacturing STL.
Run: blender -b --python scripts/prototype-epoxy-models.py
"""
from pathlib import Path
from math import sqrt
from mathutils import Vector
import bpy

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT / "public/models/material-lab"
TARGET=ROOT / "public/models/epoxy"
TARGET.mkdir(exist_ok=True,parents=True)

def main(shape):
    name='d10' if shape=='d00' else shape
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE / f'{name}.glb'))
    obj=next(o for o in bpy.context.scene.objects if o.type=='MESH')
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    mesh=obj.data
    mesh.calc_loop_triangles()
    large=max((p.area for p in mesh.polygons),default=0)
    groups=[]
    for poly in mesh.polygons:
        if poly.area < large*0.27: continue
        center=poly.center.copy()
        normal=poly.normal.copy()
        g=next((x for x in groups if x['normal'].dot(normal) > 0.99999 and abs(x['normal'].dot(center)-x['depth']) < 0.01),None)
        if g:
            g['center']+=center*poly.area
            g['area']+=poly.area
        else:
            groups.append({'normal':normal,'depth':normal.dot(center),'area':poly.area,'center':center*poly.area})
    for g in groups:g['center']/=g['area']
    expected={'d4':4,'d6':6,'d8':8,'d10':10,'d00':10,'d12':12,'d20':20}[shape]
    print('EPXY_FACE_SCAN',shape,'surfaces',len(groups),'expected',expected,'maxarea',large)
    if len(groups)!=expected: raise RuntimeError(f'{shape}: {len(groups)} surfaces; need {expected}')
    cuts=[]
    for i,g in enumerate(groups):
        label=(str(i*10).zfill(2) if shape=='d00' else str(i+1))
        font=bpy.data.curves.new(f'EPOXY-engrave-{label}','FONT')
        font.body=label
        font.align_x='CENTER'
        font.align_y='CENTER'
        font.size=min(0.81, max(0.5,sqrt(g['area'])*0.5))
        if len(label)>1:font.size*=0.71
        font.extrude=0.16
        font.resolution_u=8
        font.bevel_depth=0
        cut=bpy.data.objects.new('cut '+label,font)
        bpy.context.collection.objects.link(cut)
        cut.rotation_mode='QUATERNION'
        cut.rotation_quaternion=Vector((0,0,1)).rotation_difference(g['normal'])
        # Let the front of the letters protrude beyond the face while the back cuts 0.09 units in.
        cut.location=g['center'] - g['normal'] * 0.10
        bpy.ops.object.select_all(action='DESELECT')
        cut.select_set(True)
        bpy.context.view_layer.objects.active=cut
        bpy.ops.object.convert(target='MESH')
        cuts.append(bpy.context.view_layer.objects.active)
    bpy.ops.object.select_all(action='DESELECT')
    for cut in cuts: cut.select_set(True)
    bpy.context.view_layer.objects.active=cuts[0]
    bpy.ops.object.join()
    cutter=bpy.context.view_layer.objects.active
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active=obj
    mod=obj.modifiers.new('Recessed dice lettering','BOOLEAN')
    mod.operation='DIFFERENCE'
    mod.solver='EXACT'
    mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(island_margin=0.014)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.export_scene.gltf(filepath=str(TARGET / f'{shape}.glb'), export_format='GLB',
        use_selection=True, export_yup=False, export_materials='NONE', export_cameras=False, export_lights=False)
    print('EPXY_DONE',shape,'polys',len(obj.data.polygons),'uv',len(obj.data.uv_layers.active.data))

for shape in ('d8','d20','d6','d4','d10','d00','d12'):
    main(shape)
print('EPXY_STUDY_FINISHED')
