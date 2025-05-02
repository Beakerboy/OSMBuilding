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

// The Building object that is being rendered.
var mainBuilding;

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

  window.printError = printError;

  const params = new URLSearchParams(window.location.search);
  if (params.has('type')) {
    type = params.get('type');
  }
  if (params.has('id')) {
    id = params.get('id');
  }
  if (params.has('info')) {
    displayInfo = true;
  }
  if (params.has('errorBox')) {
    errorBox = true;
  }
  Building.create(type, id).then(function(myObj){
    mainBuilding = myObj;
    const helperSize = myObj.outerElement.getWidth();
    const helper = new GridHelper(helperSize / 0.9, helperSize / 9);
    scene.add(helper);

    const mesh = myObj.render();
    for (let i = 0; i < mesh.length; i++) {
      if (mesh[i] && mesh[i].isObject3D) {
        scene.add(mesh[i]);
      } else {
        window.printError('not Object');
      }
    }
    if (displayInfo) {
      gui = new GUI();
      const info = myObj.getInfo();
      const folder = gui.addFolder(info.type + ' - ' + info.id);
      createFolders(folder, info.options);
      for (let i = 0; i < info.parts.length; i++) {
        const part = info.parts[i];
        part.options.id = part.id;
        const folder = gui.addFolder(part.type + ' - ' + part.id);
        createFolders(folder, part.options);
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
 * Create GUI folders for the options of a building and roof.
 *
 * @param {GUI} folder The way or relation
 * @param {Object} options The data for a specific way
 */
function createFolders(folder, options) {
  const buildingFolder = folder.addFolder('Building');
  const roofFolder = folder.addFolder('Roof');
  for (var property in options.building) {
    const buildFunc = function() {
      const mesh = scene.getObjectByName('b' + options.id);
      mesh.visible = options.building.visible;
    };
    if (options.building[property]) {
      if (property === 'colour') {
        // ToDo: add support for 'named' colours.
        buildingFolder.addColor(options.building, property);
      } else if (property === 'visible') {
        buildingFolder.add(options.building, property).onChange(buildFunc);
      } else {
        buildingFolder.add(options.building, property, 0, 100 ).step(.1);
      }
      buildingFolder.close();
    }
  }
  for (var property in options.roof) {
    const roofFunc = function() {
      const mesh = scene.getObjectByName('r' + options.id);
      mesh.visible = options.roof.visible;
    };
    const roofGeo = function() {
      const mesh = scene.getObjectByName('r' + options.id);
      const geo = mainBuilding.getPartGeometry(options)[0];
      mesh.geometry.dispose();
      mesh.geometry = geo;
    };
    if (options.roof[property]) {
      if (property === 'colour') {
        roofFolder.addColor(options.roof, property);
      } else if (property === 'shape') {
        const roofTypesAvailable = ['dome', 'flat', 'gabled', 'onion', 'pyramidal', 'skillion', 'hipped', 'round', 'gambrel'];
        // If this roof is not supported, add it to the list for sanity.
        if (!roofTypesAvailable.includes(options.roof.shape)) {
          roofTypesAvailable.push(options.roof.shape);
        }
        roofFolder.add(options.roof, property, roofTypesAvailable).onChange(roofGeo);
      } else if (property === 'orientation') {
        const roofOrientationsAvailable = ['across', 'along'];
        roofFolder.add(options.roof, property, roofOrientationsAvailable);
      } else if (property === 'visible') {
        roofFolder.add(options.roof, property).onChange(roofFunc);
      } else if (property === 'direction') {
        roofFolder.add(options.roof, property, 0, 180 ).step(.5).onChange(roofGeo);
      } else {
        roofFolder.add(options.roof, property, 0, 100 ).step(.1);
        // .onChange();
      }
      roofFolder.close();
    }
  }
  folder.close();
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

/**
 * Add lights to the scene
 */
function addLights() {
  const ambientLight = new AmbientLight( 0xcccccc, 0.2 );
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

/**
 * Set the camera position
 */
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

/**
 * Manage error messages by either printing to the console or
 * the configured errorBox element.
 *
 * @param {text} str The text to add to the error log
 */
function printError(txt) {
  if (errorBox) {
    const element = document.getElementById('errorBox');
    element.insertAdjacentText('beforeend', txt + '\n');
  } else {
    console.log(txt);
  }
}
