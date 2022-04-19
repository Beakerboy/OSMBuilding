var camera;
var renderer;
var controls;
var scene = new THREE.Scene();
var home;
var building = {};

/**
 * Initialize the screen
 */
function init() {
  var type = 'way';
  var id = 66418809;
  var info = false;
  if (window.location.search.substr(1) !== null) {
    window.location.search.substr(1).split('&')
      .forEach(function(item) {
        const tmp = item.split('=');
        if (tmp[0] === 'type') {
          type = decodeURIComponent(tmp[1]);
        } else if (tmp[0] === 'id') {
          id = decodeURIComponent(tmp[1]);
        } else if (tmp[0] === 'info') {
          info = true;
        }
      });
  }
  Building.create(type, id).then(function(myObj){
    const helperSize = myObj.outerElement.getWidth();
    const helper = new THREE.GridHelper(helperSize / 0.9, helperSize / 9);
    scene.add(helper);

    myObj.render();
    if (info) {
      const elem = document.createElement('div');
      elem.setAttribute('id', 'div-building-details');
      elem.setAttribute('style', 'position:absolute; top:10px; display: block; z-index: 100; background-color: #FFFFFF');
      const target = document.querySelector('canvas');
      target.before(elem);
      const info = myObj.getInfo();
      var partsString = '';
      for (let i = 0; i < info.parts.length; i++) {
        partsString += '<div><span>Type: ' + info.parts[i].type + '</span></div><div><span>ID: ' + info.parts[i].id + '</span></div>';
      }
      elem.innerHTML = '<div><span>Type: ' + info.type + '</span></div><div><span> ID: ' + info.id + '</span></div>' + partsString;
      // Get building details from myObj
    }
  });
  camera = new THREE.PerspectiveCamera(
    50,
    document.documentElement.clientWidth /
      document.documentElement.clientHeight,
    0.1,
    1000,
  );
  renderer = new THREE.WebGLRenderer({
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

  controls = new THREE.OrbitControls( camera, renderer.domElement );
  function render() {
    requestAnimationFrame(render);

    renderer.render(scene, camera);
  }
  render();
}

function addLights() {
  const ambientLight = new THREE.AmbientLight( 0xcccccc, 0.2 );
  scene.add( ambientLight );

  var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
  hemiLight.position.set( 0, 500, 0 );
  scene.add( hemiLight );

  var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
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
