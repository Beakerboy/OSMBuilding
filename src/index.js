import * as THREE from "three";
import { OrbitControls } from "https://unpkg.com/three@0.138.3/examples/jsm/controls/OrbitControls.js";
var camera;
var renderer;
var controls;
function init() {
  camera = new THREE.PerspectiveCamera(
    50,
    document.documentElement.clientWidth /
      document.documentElement.clientHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({
    alpha: false
  });
  renderer.setSize(
    document.documentElement.clientWidth,
    document.documentElement.clientHeight
  );
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.zIndex = 0;
  renderer.domElement.style.top = 0;
  document.body.appendChild(renderer.domElement);
}

function createScene() {
  var shapes = [];
  shapes = buildStructure();

  var scene = new THREE.Scene();
  scene.add(shapes[0]);

  var pointLight = new THREE.PointLight(0x888888);
  pointLight.position.set(0, 0, 500);
  scene.add(pointLight);
  camera.position.set(0, -0.2, 0.05); // x y z
  
  controls = new OrbitControls( camera, renderer.domElement );
  function render() {
    requestAnimationFrame(render);

    renderer.render(scene, camera);
  }
  render();
}

function buildStructure() {
  let apis = {
    get_way: {
      api:"https://api.openstreetmap.org/api/0.6/way/",
      parameters:"/full",
      url: (way_id) => {
        return apis.get_way.api + way_id + apis.get_way.parameters
      }
    }
  };
  const way_id = "579354478";
  data = fetch(apis.get_way.url(way_id))
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => console.log(data));
  const elements = data.getElementsByTagName("node");
  const shape = new THREE.Shape();
  var home_lon = 0;
  var home_lat = 0;
  for (let i = 0; i < elements.length; i++) {
    lat = elements[i].getAttribute("lat");
    lon = elements[i].getAttribute("lon");
    if (i === 0) {
      const home_lat = lat;
      const home_lon = lon;
      shape.moveTo(0, 0);
      console.log("shape.moveTo(0, 0)")
    } else {
      shape.lineTo((lat - home_lat) * 1000, (lon - home_lon) * 1000);
      console.log("shape.lineTo(" + (lat - home_lat) * 1000 +", " + (lon - home_lon) * 1000 + ")");
    }
  }
  const extrudeSettings = {
    depth: 0.01,
    bevelEnabled: false,
    steps: 2
  };
  var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  var material = new THREE.MeshLambertMaterial({
    color: 0x0064ff,
    emissive: 0x1111111
  });

  var shapes = [];
  shapes[0] = new THREE.Mesh(geometry, material);
  shapes[0].position.set(0, 0, 0);
  return shapes
}

init();
createScene();
window.addEventListener("resize", resize, false);

function resize() {
  camera.aspect =
    document.documentElement.clientWidth /
    document.documentElement.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(
    document.documentElement.clientWidth,
    document.documentElement.clientHeight
  );

}
