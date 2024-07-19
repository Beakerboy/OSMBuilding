import { GUI } from "lil-gui";
import { Scene } from "three";

export function createFolders(mainBuilding: any, scene: Scene, folder: GUI, options: any) {
  const buildingFolder = folder.addFolder("Building");
  const roofFolder = folder.addFolder("Roof");
  for (var property in options.building) {
    const buildFunc = function () {
      const mesh = scene.getObjectByName("b" + options.id);
      if (mesh) {
        mesh.visible = options.building.visible;
      }
    };
    if (options.building[property]) {
      if (property === "colour") {
        // ToDo: add support for 'named' colours.
        buildingFolder.addColor(options.building, property);
      } else if (property === "visible") {
        buildingFolder.add(options.building, property).onChange(buildFunc);
      } else {
        buildingFolder.add(options.building, property, 0, 100).step(0.1);
      }
      buildingFolder.close();
    }
  }
  for (var property in options.roof) {
    const roofFunc = function () {
      const mesh = scene.getObjectByName("r" + options.id);
      if (mesh) {
        mesh.visible = options.roof.visible;
      }
    };
    const roofGeo = function () {
      const mesh = scene.getObjectByName("r" + options.id);
      const geo = mainBuilding.getPartGeometry(options)[0];
      if (mesh) {
        (mesh as any).geometry.dispose();
        (mesh as any).geometry = geo;
      }
    };
    if (options.roof[property]) {
      if (property === "colour") {
        roofFolder.addColor(options.roof, property);
      } else if (property === "shape") {
        const roofTypesAvailable = [
          "dome",
          "flat",
          "gabled",
          "onion",
          "pyramidal",
          "skillion",
          "hipped",
          "round",
          "gambrel",
          "round",
        ];
        // If this roof is not supported, add it to the list for sanity.
        if (!roofTypesAvailable.includes(options.roof.shape)) {
          roofTypesAvailable.push(options.roof.shape);
        }
        roofFolder.add(options.roof, property, roofTypesAvailable).onChange(roofGeo);
      } else if (property === "orientation") {
        const roofOrientationsAvailable = ["across", "along"];
        roofFolder.add(options.roof, property, roofOrientationsAvailable);
      } else if (property === "visible") {
        roofFolder.add(options.roof, property).onChange(roofFunc);
      } else {
        roofFolder.add(options.roof, property, 0, 100).step(0.1);
        // .onChange();
      }
      roofFolder.close();
    }
  }
  folder.close();
}
