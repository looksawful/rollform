"""Rebuild precise, narrow bevels from ROLLFORM's canonical Three.js geometry.

Run from project root:
  node --experimental-strip-types scripts/export-dice-bases.mjs
  blender -b --factory-startup --python scripts/bevel-dice.py

Compare scripts/.mesh-tmp/precise/ with published GLBs before replacing assets.
The main polygon faces remain flat; only the narrow edge strips are smoothed.
This script never overwrites public/models/.
"""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy
import bmesh

PROJECT = Path(__file__).resolve().parent.parent
BASES = PROJECT / "scripts" / ".mesh-tmp" / "bases.json"
WIDTH = {"d4": 0.029, "d6": 0.026, "d8": 0.026,
         "d10": 0.014, "d12": 0.016, "d20": 0.022}
FACE_COUNT = {"d4": 4, "d6": 6, "d8": 8,
              "d10": 10, "d12": 12, "d20": 20}


def make_polyhedron(name, source):
    verts = [tuple(p) for triangle in source["triangles"] for p in triangle]
    triangles = [(i, i + 1, i + 2) for i in range(0, len(verts), 3)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], triangles)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-5)
    bmesh.ops.dissolve_limit(
        bm, angle_limit=math.radians(0.15), use_dissolve_boundaries=False,
        verts=list(bm.verts), edges=list(bm.edges), delimit=set()
    )
    bm.normal_update()
    faces = len(bm.faces)
    bad = [edge for edge in bm.edges if not edge.is_manifold]
    if faces != FACE_COUNT[name] or bad:
        raise ValueError(f"{name}: base has {faces} faces (expected {FACE_COUNT[name]}), {len(bad)} invalid edges")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    for polygon in mesh.polygons:
        polygon.use_smooth = False
    return obj


def refine(obj, name, face_planes):
    bevel = obj.modifiers.new("Edge radius", "BEVEL")
    bevel.width = WIDTH[name]
    bevel.segments = 4
    bevel.profile = 0.5
    bevel.limit_method = "ANGLE"
    bevel.angle_limit = math.radians(10.0)
    bevel.affect = "EDGES"
    bevel.use_clamp_overlap = True
    bevel.loop_slide = False
    bevel.miter_outer = "MITER_PATCH"
    bevel.miter_inner = "MITER_ARC"
    bevel.vmesh_method = "ADJ"
    bevel.harden_normals = True
    bevel.face_strength_mode = "FSTR_AFFECTED"
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    # Blanket smoothing and weighted normals made planar facets look fused.
    # Keep original main faces flat; shade only new rounded edge strips smoothly.
    planar_count = 0
    for polygon in obj.data.polygons:
        is_face = any(
            all(abs(sum(n * (obj.data.vertices[vid].co[k] - plane["center"][k])
                        for k, n in enumerate(plane["normal"]))) < 5e-5
                for vid in polygon.vertices)
            for plane in face_planes
        )
        polygon.use_smooth = not is_face
        planar_count += is_face
    if planar_count != FACE_COUNT[name]:
        raise ValueError(f"{name}: expected {FACE_COUNT[name]} planar facets, got {planar_count}")

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    nonmanifold = sum(1 for edge in bm.edges if not edge.is_manifold)
    n_verts, n_edges, n_faces = len(bm.verts), len(bm.edges), len(bm.faces)
    bm.free()
    if nonmanifold or n_verts - n_edges + n_faces != 2:
        raise ValueError(f"{name}: geometry invalid: nonmanifold={nonmanifold}, Euler={n_verts - n_edges + n_faces}")
    if any(p.area <= 1e-10 for p in obj.data.polygons):
        raise ValueError(f"{name}: degenerate triangle")
    return {"vertices": n_verts, "polygons": n_faces, "tris": sum(len(p.vertices) - 2 for p in obj.data.polygons),
            "planar_facets": planar_count, "nonmanifold": nonmanifold,
            "euler": n_verts - n_edges + n_faces}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--shape", choices=list(WIDTH), default=None)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    sources = json.loads(BASES.read_text(encoding="utf-8"))
    output = BASES.parent / "precise"
    output.mkdir(parents=True, exist_ok=True)
    report = {"variant": "precise", "models": {}}

    for name in ([args.shape] if args.shape else list(WIDTH)):
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)
        obj = make_polyhedron(name, sources[name])
        quality = refine(obj, name, sources[name]["faces"])
        glb = output / f"{name}.glb"
        bpy.ops.export_scene.gltf(
            filepath=str(glb), export_format="GLB", use_selection=True,
            export_yup=False, export_materials="NONE",
            export_cameras=False, export_lights=False,
        )
        report["models"][name] = {"bevel": WIDTH[name], "segments": 4, "file": str(glb), **quality}
        print("ROLLFORM_MODEL", name, json.dumps(report["models"][name]))
    (output / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
