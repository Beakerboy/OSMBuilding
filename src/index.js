var camera;
var renderer;
var controls;
var scene = new THREE.Scene();
var home;
var helper_size;
var building = {};

/**
 * Initialize the screen
 */
function init() {
  var type = 'way';
  var id = 66418809;
  if (window.location.search.substr(1) !== null) {
    window.location.search.substr(1).split('&')
      .forEach(function(item) {
        tmp = item.split('=');
        if (tmp[0] === 'type') {
          type = decodeURIComponent(tmp[1]);
        } else if (tmp[0] === 'id') {
          id = decodeURIComponent(tmp[1]);
        }
      });
  }
  Building.create(type, id).then(function(myObj){
    const helper_size = myObj.outer_element.getWidth();
    const helper = new THREE.GridHelper(helper_size / 0.9, helper_size / 9);
    scene.add(helper);

    myObj.render();
  });
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
    document.documentElement.clientHeight-20
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
    document.documentElement.clientHeight
  );
}
