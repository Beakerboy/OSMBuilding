import {
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  AmbientLight,
  HemisphereLight,
  DirectionalLight,
} from 'three';
import {OrbitControls} from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
import {Building} from './building.js';

var camera;
var renderer;
var controls;
var scene = new Scene();
var home;

var helperSize;

var building = {};

/**
 * Initialize the screen
 */
function init() {
  var type = 'way';
  var id = 66418809;

  var displayInfo = false;

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
      const elem = document.createElement('div');
      elem.setAttribute('id', 'div-building-details');
      elem.setAttribute('style', 'position:absolute; top:10px; display: block; z-index: 100; background-color: #FFFFFF');
      const target = document.querySelector('canvas');
      target.before(elem);
      const info = myObj.getInfo();
      var partsString = '';
      for (let i = 0; i < info.parts.length; i++) {
        info.parts[i].options.inherited = {};
        info.parts[i].options.specified = {};
        partsString += '<div class="building-part collapsible" style="border-style: solid"> <input type="checkbox" id="building ' + info.parts[i].id + '" onclick="ShowHideDiv(this)" /> <input type="checkbox" id="roof' + info.parts[i].id + '" onclick="ShowHideDiv(this)" /> <span>Type: ' + info.parts[i].type + '</span><span>ID: ' + info.parts[i].id + '</span></div><div class="content"><span>Options: ' + JSON.stringify(info.parts[i].options) + '</span></div>';
      }
      info.options.inherited = {};
      info.options.specified = {};
      elem.innerHTML = '<div class="infobox"><div class="topBuilding"><span>Type: ' + info.type + '</span><span> ID: ' + info.id + '</span><span>Options: ' + JSON.stringify(info.options) + '</span></div>' + partsString + '</div>';
      // Get building details from myObj
      var coll = document.getElementsByClassName('collapsible');
      var i;

      for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener('click', function() {
          this.classList.toggle('active');
          var content = this.nextElementSibling;
          if (content.style.display === 'block') {
            content.style.display = 'none';
          } else {
            content.style.display = 'block';
          }
        });
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

function showHideDiv(object) {
  const mesh = scene.getObjectByName(object.id);
  mesh.visible = false;
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
