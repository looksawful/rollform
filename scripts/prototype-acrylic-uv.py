"""ROLLFORM prototype only: produce UV-unwrapped copies; never touch product GLBs."""
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "models"
TARGET = SOURCE / "material-lab"
TARGET.mkdir(parents=True, exist_ok=True)

for name in ("d4", "d6", "d8", "d10", "d12", "d20"):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE / f"{name}.glb"))
    objects = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    assert len(objects) == 1, (name, len(objects))
    obj = objects[0]
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(island_margin=0.018)
    bpy.ops.object.mode_set(mode="OBJECT")
    assert obj.data.uv_layers.active
    bpy.ops.export_scene.gltf(
        filepath=str(TARGET / f"{name}.glb"), export_format="GLB",
        use_selection=True, export_yup=False, export_materials="NONE",
        export_cameras=False, export_lights=False)
    print("ROLLFORM_UV", name, len(obj.data.polygons), len(obj.data.uv_layers.active.data))
