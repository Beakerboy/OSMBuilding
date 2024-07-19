<script lang="ts">
  import { Building } from "./buildings/building.js";
  import {
    GridHelper,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    AmbientLight,
    HemisphereLight,
    DirectionalLight,
    Camera,
  } from "three";
  import { GUI } from "lil-gui";
  import { createFolders } from "./createFolders";
  import { onMount } from "svelte";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

  /**
   * Initialize the screen
   */
  let type = "way";
  let id = 66418809;
  let errorBox = false;
  let mainBuilding;
  let camera;
  let renderer;

  let displayInfo = false;
  const params = new URLSearchParams(document.location.search);

  if (params.size) {
    params.forEach((value, key) => {
      if (key === "type") {
        type = decodeURIComponent(value);
      } else if (key === "id") {
        id = parseInt(decodeURIComponent(value));
      } else if (key === "info") {
        displayInfo = true;
      } else if (key === "errorBox") {
        errorBox = true;
      }
    });
  }

  const scene = new Scene();
  let gui;

  Building.create(type, id).then(function (myObj) {
    mainBuilding = myObj;
    const helperSize = myObj.outerElement.getWidth();
    const helper = new GridHelper(helperSize / 0.9, helperSize / 9);
    scene.add(helper);

    const mesh = myObj.render();
    for (let i = 0; i < mesh.length; i++) {
      scene.add(mesh[i]);
    }
    if (displayInfo) {
      gui = new GUI();
      const info = myObj.getInfo();
      const folder = gui.addFolder(info.type + " - " + info.id);
      createFolders(mainBuilding, scene, folder, info.options);
      for (let i = 0; i < info.parts.length; i++) {
        const part = info.parts[i];
        part.options.id = part.id;
        const folder = gui.addFolder(part.type + " - " + part.id);
        createFolders(mainBuilding, scene, folder, part.options);
      }
    }
  });
  camera = new PerspectiveCamera(
    50,
    document.documentElement.clientWidth / document.documentElement.clientHeight,
    0.1,
    1000
  );
  onMount(() => {
    renderer = new WebGLRenderer({
      canvas: document.getElementById("mainCanvas")!,
      alpha: false,
    });
    renderer.setSize(document.documentElement.clientWidth, document.documentElement.clientHeight - 20);
    createScene(renderer, camera);
  });

  function addLights() {
    const ambientLight = new AmbientLight(0xcccccc, 0.2);
    scene.add(ambientLight);

    var hemiLight = new HemisphereLight(0xffffff, 0xffffff, 0.6);
    hemiLight.position.set(0, 500, 0);
    scene.add(hemiLight);

    var dirLight = new DirectionalLight(0xffffff, 1);
    dirLight.position.set(-1, 0.75, 1);
    dirLight.position.multiplyScalar(1000);
    scene.add(dirLight);
  }

  function createScene(renderer: WebGLRenderer, camera: PerspectiveCamera) {
    addLights();
    camera.position.set(0, 0, 200); // x y z
    camera.far = 50000;
    camera.updateProjectionMatrix();
    let controls = new OrbitControls(camera, renderer.domElement);

    function render() {
      requestAnimationFrame(render);

      renderer.render(scene, camera);
    }
    render();
  }
</script>

<div>
  <canvas id="mainCanvas" />
</div>
