import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
var camera;
var renderer;
var controls;
function init() {
  var scene = new THREE.Scene();
  console.log(scene);
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
  renderer.domElement.style.zIndex = 1;
  renderer.domElement.style.top = 0;
  document.body.appendChild(renderer.domElement);
  const shape = new THREE.Shape();
  shape.moveTo( 0,0 );
  shape.lineTo( 0, 1 );
  shape.lineTo( 2, 1 );
  shape.lineTo( 2, 0 );
  shape.lineTo( 1, 0 );
  shape.lineTo( 1, .5 );
  shape.lineTo( .5, .5 );
  shape.lineTo( .5, 0 );
  shape.lineTo( 0, 0 );
  const extrudeSettings = {
    steps: 2,
    depth: 1,
    bevelEnabled: false,
  };
  var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  var material = new THREE.MeshLambertMaterial({
    color: 0x0064ff,
    emissive: 0x1111111
  });

  shape[0] = new THREE.Mesh(geometry, material);
  shape[0].position.set(3, 5, 0);
  scene.add(shape[0]);

  var pointLight = new THREE.PointLight(0x888888);
  pointLight.position.set(1, 100, 500);
  scene.add(pointLight);
  camera.position.set(3, 5.5, 10); // x y z
  
  controls = new OrbitControls( camera, renderer.domElement );
  function render() {
    requestAnimationFrame(render);

    renderer.render(scene, camera);
  }
  render();

}

init();
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
