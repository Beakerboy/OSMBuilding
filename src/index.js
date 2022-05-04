import {
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  AmbientLight,
  HemisphereLight,
  DirectionalLight,
  WireframeGeometry,
} from 'three';
import {OrbitControls} from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
import {Building} from './building.js';
import {GUI} from 'https://unpkg.com/three/examples/jsm/libs/lil-gui.module.min.js';

var camera;
var renderer;
var controls;
var scene = new Scene();
var home;

var helperSize;

var building = {};

var errorBox = false;

var gui;
/**
 * Initialize the screen
 */
function init() {
  var type = 'way';
  var id = 66418809;

  var displayInfo = false;
  window.showHideDiv = showHideDiv;
  window.printError = printError;
  if (window.location.search.substr(1) !== null) {
    window.location.search.substr(1).split('&')
      .forEach(function(item) {
        const tmp = item.split('=');
        if (tmp[0] === 'type') {
          type = decodeURIComponent(tmp[1]);
        } else if (tmp[0] === 'id') {
          id = decodeURIComponent(tmp[1]);
        } else if (tmp[0] === 'info') {
          displayInfo = true;
        } else if (tmp[0] === 'errorBox') {
          errorBox = true;
        }
      });
  }
  Building.create(type, id).then(function(myObj){
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
      for (let i = 0; i < info.parts.length; i++) {
        const part = info.parts[i];
        const folder = gui.addFolder(part.id);
        const buildingFolder = folder.addFolder('Building');
        const roofFolder = folder.addFolder('Roof');
        for (var property in part.options.building) {
          if (part.options.building[property]) {
            buildingFolder.add(part.options.building, property, 0, 100 ).step(.1);
            buildingFolder.close();
          }
        }
        for (var property in part.options.roof) {
          if (part.options.roof[property]) {
            roofFolder.add(part.options.roof, property, 0, 100 ).step(.1);
            roofFolder.close();
          }
        }
        folder.close();
        //.onChange(generateGeometry);
      }
    }
  });
  camera = new PerspectiveCamera(
    50,
    document.documentElement.clientWidth /
      document.documentElement.clientHeight,
    0.1,
    1000,
  );
  renderer = new WebGLRenderer({
    alpha: false,
  });
  renderer.setSize(
    document.documentElement.clientWidth,
    document.documentElement.clientHeight-20,
  );
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.zIndex = 0;
  renderer.domElement.style.top = 0;
  document.body.appendChild(renderer.domElement);
}

/**
 * Create the scene
 */
function createScene() {
  addLights();
  camera.position.set(0, 0, 200); // x y z
  camera.far = 50000;
  camera.updateProjectionMatrix();
  controls = new OrbitControls( camera, renderer.domElement );

  function render() {
    requestAnimationFrame(render);

    renderer.render(scene, camera);
  }
  render();
}

function showHideDiv(objectId) {
  const mesh = scene.getObjectByName(objectId);
  if (!mesh) {
    console.log('Mesh ' + objectId + ' not found');
  } else {
    if (document.querySelector('#' + objectId).checked) {
      mesh.visible = false;
    } else {
      mesh.visible = true;
    }
  }
}

function addLights() {
  const ambientLight =new AmbientLight( 0xcccccc, 0.2 );
  scene.add( ambientLight );

  var hemiLight = new HemisphereLight( 0xffffff, 0xffffff, 0.6 );
  hemiLight.position.set( 0, 500, 0 );
  scene.add( hemiLight );

  var dirLight = new DirectionalLight( 0xffffff, 1 );
  dirLight.position.set( -1, 0.75, 1 );
  dirLight.position.multiplyScalar( 1000 );
  scene.add( dirLight );
}

init();
createScene();
window.addEventListener('resize', resize, false);

function resize() {
  camera.aspect =
    document.documentElement.clientWidth /
    document.documentElement.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(
    document.documentElement.clientWidth,
    document.documentElement.clientHeight,
  );
}

function printError(txt) {
  if (errorBox) {
    const element = document.getElementById('errorBox');
    element.insertAdjacentText('beforeend', txt + '\n');
  } else {
    console.log(txt);
  }
}
function updateGroupGeometry( mesh, geometry ) {
  mesh.children[ 0 ].geometry.dispose();
  mesh.children[ 1 ].geometry.dispose();
  mesh.children[ 0 ].geometry = new WireframeGeometry(geometry);
  mesh.children[ 1 ].geometry = geometry;
  // these do not update nicely together if shared
}
