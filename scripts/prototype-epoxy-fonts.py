"""Prototype only: 4 open-license typography specimens engraved into ROLLFORM dice.
Font sources are downloaded to the private scratch folder and NOT added to the repo.
Build output is geometry-only GLB with Body and GoldInlay meshes.
"""
from pathlib import Path
from math import sqrt
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'public/models/material-lab'
OUT=ROOT/'public/models/epoxy-font'
FONTS=Path('A:/AgentWork/scratch/rollform-font-build')
SHAPES=('d4','d6','d8','d10','d00','d12','d20')
EXPECTED={'d4':4,'d6':6,'d8':8,'d10':10,'d00':10,'d12':12,'d20':20}

def make(shape,fontname,fontfile):
    name='d10' if shape=='d00' else shape
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE/(name+'.glb')))
    body=next(o for o in bpy.context.scene.objects if o.type=='MESH')
    body.name='Body'
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    bpy.context.view_layer.objects.active=body
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    mesh=body.data
    maxarea=max(p.area for p in mesh.polygons)
    faces=[]
    for poly in mesh.polygons:
        if poly.area<maxarea*.27: continue
        normal=poly.normal.copy()
        c=poly.center.copy()
        face=next((x for x in faces if x['normal'].dot(normal)>.99999 and abs(x['depth']-normal.dot(c))<.012),None)
        if face:
            face['weighted']+=c*poly.area
            face['area']+=poly.area
        else: faces.append(dict(normal=normal,depth=normal.dot(c),area=poly.area,weighted=c*poly.area))
    if len(faces)!=EXPECTED[shape]:raise ValueError((shape,len(faces)))
    cutters=[]
    inlays=[]
    loaded=bpy.data.fonts.load(str(fontfile))
    for i,face in enumerate(faces):
        label=str(i*10).zfill(2) if shape=='d00' else str(i+1)
        center=face['weighted']/face['area']
        normal=face['normal']
        size=min(.83,max(.47,sqrt(face['area'])*.51))
        if len(label)>1:size*=.66
        # Cut a shallow but volumetric groove with exactly this numeral's outline.
        curve=bpy.data.curves.new(f'cutter-curve-{label}','FONT')
        curve.body=label
        curve.font=loaded
        curve.align_x='CENTER'
        curve.align_y='CENTER'
        curve.size=size
        curve.resolution_u=9
        curve.extrude=.10
        cutter=bpy.data.objects.new('Cut_'+label,curve)
        bpy.context.collection.objects.link(cutter)
        cutter.rotation_mode='QUATERNION'
        cutter.rotation_quaternion=Vector((0,0,1)).rotation_difference(normal)
        cutter.location=center-normal*.045
        bpy.ops.object.select_all(action='DESELECT')
        cutter.select_set(True)
        bpy.context.view_layer.objects.active=cutter
        bpy.ops.object.convert(target='MESH')
        cutters.append(bpy.context.view_layer.objects.active)
        # Matching gold pigment, recessed behind face, no flat canvas-label duplication.
        inkcurve=bpy.data.curves.new(f'ink-curve-{label}','FONT')
        inkcurve.body=label
        inkcurve.font=loaded
        inkcurve.align_x='CENTER'
        inkcurve.align_y='CENTER'
        inkcurve.size=size
        inkcurve.resolution_u=9
        inkcurve.extrude=.005
        ink=bpy.data.objects.new('Ink_'+label,inkcurve)
        bpy.context.collection.objects.link(ink)
        ink.rotation_mode='QUATERNION'
        ink.rotation_quaternion=cutter.rotation_quaternion.copy()
        ink.location=center-normal*.118
        bpy.ops.object.select_all(action='DESELECT')
        ink.select_set(True)
        bpy.context.view_layer.objects.active=ink
        bpy.ops.object.convert(target='MESH')
        inlays.append(bpy.context.view_layer.objects.active)
    bpy.ops.object.select_all(action='DESELECT')
    for c in cutters:c.select_set(True)
    bpy.context.view_layer.objects.active=cutters[0]
    bpy.ops.object.join()
    cut=bpy.context.view_layer.objects.active
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    bpy.context.view_layer.objects.active=body
    boolean=body.modifiers.new('Engraved numbers','BOOLEAN')
    boolean.operation='DIFFERENCE'
    boolean.solver='EXACT'
    boolean.object=cut
    bpy.ops.object.modifier_apply(modifier=boolean.name)
    bpy.data.objects.remove(cut,do_unlink=True)
    bpy.ops.object.select_all(action='DESELECT')
    for ink in inlays: ink.select_set(True)
    bpy.context.view_layer.objects.active=inlays[0]
    bpy.ops.object.join()
    gold=bpy.context.view_layer.objects.active
    gold.name='GoldInlay'
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    bpy.context.view_layer.objects.active=body
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(island_margin=.013)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')
    gold.select_set(True)
    bpy.context.view_layer.objects.active=gold
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(island_margin=.013)
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    gold.select_set(True)
    bpy.context.view_layer.objects.active=body
    target=OUT/fontname
    target.mkdir(parents=True,exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(target/(shape+'.glb')),export_format='GLB', use_selection=True,
        export_materials='NONE', export_yup=False, export_cameras=False, export_lights=False)
    print('FONT_GLB',fontname,shape,len(body.data.polygons),len(gold.data.polygons))

for file in sorted(FONTS.glob('*.ttf')):
    for shape in SHAPES: make(shape,file.stem,file)
print('FONT_GLB_COMPLETE')
