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
  var shape = [];
  var geometry = new THREE.IcosahedronGeometry(2, 0);
  var material = new THREE.MeshLambertMaterial({
    color: 0x0064ff,
    emissive: 0x1111111
  });
  var geometryFrame = new THREE.IcosahedronGeometry(4, 0);
  var materialFrame = new THREE.MeshBasicMaterial({
    wireframe: true,
    transparent: true,
    opacity: 0.1,
    color: 0xffffff
  });
  shape[0] = new THREE.Mesh(geometryFrame, materialFrame);
  shape[0].position.set(3, 5, 0);
  shape[1] = new THREE.Mesh(geometry, material);
  shape[1].position.set(3, 5, 0);
  scene.add(shape[0]);
  scene.add(shape[1]);

  var pointLight = new THREE.PointLight(0x888888);
  pointLight.position.set(1, 100, 500);
  scene.add(pointLight);
  camera.position.set(3, 5.5, 10); // x y z
  
  controls = new OrbitControls( camera, renderer.domElement );
  function render() {
    requestAnimationFrame(render);
    shape[0].rotation.x -= 0.005;
    shape[0].rotation.y -= 0.005;
    shape[1].rotation.x += 0.02;
    shape[1].rotation.y += 0.02;
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

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

  }
}
