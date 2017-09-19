/** 
*   @author     with4 / github.com/with4
*   @file       scene for three.js WebVR
*   @version    0.0.7
**/

if (typeof require === 'function') {
    var THREE = require('three');
}

WEBVR.checkAvailability().catch(function (message) {
    document.body.appendChild(WEBVR.getMessageContainer(message));
});

/*********************************/
/*       GLOBAL VARIABLES        */
/*********************************/
var container, scene, camera, renderer, controls, stats;
var crosshair;
var isMouseDown = false;

var keyboard = new THREEx.KeyboardState();
// var clock = new THREE.Clock();

init();
animate();


/***********************/
/*      FUNCTIONS      */
/***********************/
function init() 
{
    // Append the canvas element created by the renderer to document body element.
    container = document.createElement('div');
    document.body.appendChild(container);

    /***********************/
    /*       SCENE        */
    /***********************/
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x505050 );
    
    /***********************/
    /*       CAMERA        */
    /***********************/
    camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.add(camera);
    // camera.position.set(24.2456, 1.6911, 15.984);
    camera.position.set(1, 0, 1);

    /***********************/
    /*     CROSS-HAIR      */
    /***********************/
    crosshair = new THREE.Mesh(
        new THREE.RingGeometry(0.02, 0.04, 32),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            opacity: 0.3,
            transparent: true
        })
    );
    crosshair.position.z = -2;
    camera.add(crosshair);

    /***********************/
    /*       RENDERER      */
    /***********************/
    if (Detector.webgl) {
        renderer = new THREE.WebGLRenderer( {antialias: true} );
    } else {
        renderer = new THREE.CanvasRenderer();
        var warining = Detector.getWebGLErrorMessage();
        document.getElementById('container').appendChild(warning);
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    /***********************/
    /*       WEBVR         */
    /***********************/
    renderer.vr.enabled = true;
    WEBVR.getVRDisplay(function (display) {
        //camera.position.set(24.2456, 1.6911, 15.984);
        renderer.vr.setDevice(display);
        document.body.appendChild(WEBVR.getButton(display, renderer.domElement));
    });

    /***********************/
    /*      EVENTS         */
    /***********************/
    renderer.domElement.addEventListener( 'mousedown', onMouseDown, false );
    renderer.domElement.addEventListener( 'mouseup', onMouseUp, false );
    renderer.domElement.addEventListener( 'touchstart', onMouseDown, false );
    renderer.domElement.addEventListener( 'touchend', onMouseUp, false );
    document.addEventListener('keydown', onKeyDown, false);

    // automatically resize renderer
    THREEx.WindowResize(renderer, camera);
    // toggle full-screen on given key press
    THREEx.FullScreen.bindKey( {charCode: 'm'.charCodeAt(0)} );

    // mouse events
    function onMouseDown() { isMouseDown = true; }
    function onMouseUp() { isMouseDown = false; }
    function onKeyDown(e) {
        // console.log(e.keyCode);
        // camera.position.y += 1;
    }

    /***********************/
    /*      CONTROLS       */
    /***********************/
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    /***********************/
    /*      STATS          */
    /***********************/
    // displays current and past frames per sec attained by scene
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild(stats.domElement);

    /***********************/
    /*      LIGHT          */
    /***********************/
    var light = new THREE.AmbientLight(0xFFFFFF);
    scene.add(light);

    /***********************/
    /*      GEOMETRY       */
    /***********************/
    // Loader //
    var loader = new THREE.JSONLoader();
    loader.load(
        // resource URL
        '/assets/naviworks/naviworks_base.js', 
        
        // function when resource is loaded
        function(geometry, materials) {
            var material = new THREE.MeshFaceMaterial(materials);
            var object = new THREE.Mesh(geometry, material);
            scene.add(object);
            object.position.set(-24.2456, -1.6911, -15.984);
        }
    );

}

function animate() {
    renderer.animate(render);
}

function render() {
    //requestAnimationFrame(animate);
    controls.update();
    stats.update();
    renderer.render(scene, camera);
}