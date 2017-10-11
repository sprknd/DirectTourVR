/** 
*   @author     with4 / github.com/with4
*   @file       scene for three.js WebVR
*   @version    0.2.0
**/

if (typeof require === 'function') {
    var THREE = require('three');
}

// WEBVR.checkAvailability().catch(function (message) {
//     document.body.appendChild(WEBVR.getMessageContainer(message));
// });

/*********************************/
/*       GLOBAL VARIABLES        */
/*********************************/
var container, scene, camera, renderer, controls, stats;
var crosshair;
var isMouseDown = false;
var clock;
var room;
var pointLight, pointLight2;

var keyboard = new THREEx.KeyboardState();
var gamepads;
var controlsEnabled = false;
var raycaster, raycasterCamera, INTERACTED;
var collidableMeshList = [];
var interactableMeshList = [];

var box;

var directionList = [
    new THREE.Vector3(0, 0, 1),     // 0
    new THREE.Vector3(1, 0, 1),     // 45
    new THREE.Vector3(1, 0, 0),     // 90
    new THREE.Vector3(1, 0, -1),    // 135
    new THREE.Vector3(0, 0, -1),    // 180
    new THREE.Vector3(-1, 0, -1),   // 225
    new THREE.Vector3(-1, 0, 0),    // 270
    new THREE.Vector3(-1, 0, 1)     // 315
];

/***********************/
/*    POINTER LOCK     */
/***********************/
var havePointerLock = 
    'pointerLockElement'        in document ||
    'mozPointerLockElement'     in document ||
    'webkitPointerLockElement'  in document;

if (havePointerLock) {
    var element = document.body;
    var pointerlockchange = function (event) {
        if (document.pointerLockElement === element ||
            document.mozPointerLockElement === element ||
            document.webkitPointerLockElement === element) {
            controls.enabled = true;
            controlsEnabled = true;
        }
        else {
            controls.enabled = false;
            controlsEnabled = false;
        }
    }

}
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();


init();
animate();



/***********************/
/*      FUNCTIONS      */
/***********************/
function init() 
{
    clock = new THREE.Clock();
    playMusic();

    // Append the canvas element created by the renderer to document body element.
    container = document.createElement('div');
    document.body.appendChild(container);

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
        renderer.vr.setDevice(display);
        document.body.appendChild(WEBVR.getButton(display, renderer.domElement));
    });

    /***********************/
    /*       SCENE        */
    /***********************/
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );
    //scene.fog = new THREE.Fog(0xffffff, 0, 300);

    /***********************/
    /*      LIGHT          */
    /***********************/
    var light = new THREE.HemisphereLight( 0xfff0f0, 0x606066 );
    var light = new THREE.AmbientLight(0xFFFFFF);
    scene.add(light);

    function createLight (color) {
        var pointLight = new THREE.PointLight(color, 30, 30);
        pointLight.castShadow = true;
        pointLight.shadow.camera.near = 1;
        pointLight.shadow.camera.far = 60;
        pointLight.shadow.bias = -0.005;    // reduce self-shadowing on double-sided objects

        var geometry = new THREE.SphereGeometry(0.3, 12, 6);
        var material = new THREE.MeshBasicMaterial({ color: color });
        var sphere = new THREE.Mesh(geometry, material);
        pointLight.add(sphere);
        return pointLight;
    }

    pointLight = createLight(0xff0000);
    pointLight2 = createLight(0xfff000);
    scene.add(pointLight);
    scene.add(pointLight2);

    /***********************/
    /*       CAMERA        */
    /***********************/
    camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.add(camera);
    camera.position.set(1, 0, 1);
        
    /***********************/
    /*       SKYBOX        */
    /***********************/
    room = new THREE.Mesh(
        new THREE.BoxGeometry(10, 7, 10, 10, 7, 10),
        new THREE.MeshBasicMaterial({ color: 0x808080, wireframe: true })
    );
    room.position.set(30, 4, 30);
    room.scale.set(15, 15, 15);
    scene.add(room);
    collidableMeshList.push(room);

    /***********************/
    /*      CONTROLS       */
    /***********************/
    // controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());
    controls.getObject().position.set(32.2538, 2, 92.2421);

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
    //crosshair.material.color.setHex(0xfff000);
    camera.add(crosshair);

    /***********************/
    /*      EVENTS         */
    /***********************/
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    renderer.domElement.addEventListener('mouseup', onMouseUp, false);
    renderer.domElement.addEventListener('touchstart', onMouseDown, false);
    renderer.domElement.addEventListener('touchend', onMouseUp, false);

    // hook pointer lock state change events
    document.addEventListener('pointerlockchange', pointerlockchange, false);
    document.addEventListener('mozpointerlockchange', pointerlockchange, false);
    document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

    // document.addEventListener('pointerlockerror', pointerlockerror, false);
    // document.addEventListener('mozpointerlockerror', pointerlockerror, false);
    // document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    // automatically resize renderer
    THREEx.WindowResize(renderer, camera);
    // toggle full-screen on given key press
    THREEx.FullScreen.bindKey( {charCode: 'm'.charCodeAt(0)} );

    /***********************/
    /*  EVENT FUNCTIONS    */
    /***********************/
    function onMouseDown() { isMouseDown = true; }
    function onMouseUp() { isMouseDown = false; }
    function onKeyDown(e) {
        switch (e.keyCode) {
            case 38: // up
            case 87: // W
                moveForward = true;
                break;
            case 37: // left
            case 65: // A
                moveLeft = true;
                break;
            case 40: // down
            case 83: // S
                moveBackward = true;
                break;
            case 39: // right
            case 68: // D
                moveRight = true;
                break;
            case 32: // space
                velocity.y += 250;
                break;
        }
    }

    function onKeyUp(e) {
        switch (e.keyCode) {
            case 38: // up
            case 87: // W
                moveForward = false;
                break;
            case 37: // left
            case 65: // A
                moveLeft = false;
                break;
            case 40: // down
            case 83: // S
                moveBackward = false;
                break;
            case 39: // right
            case 68: // D
                moveRight = false;
                break;
        }
    }

    /***********************/
    /*     RAY CASTER      */
    /***********************/
    raycaster = new THREE.Raycaster(new THREE.Vector3(),
        new THREE.Vector3(0, -1, 0),0, 10);

    raycasterCamera = new THREE.Raycaster();
    
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
            var naviworks_base = new THREE.Mesh(geometry, material);
            naviworks_base.name = "naviworks_base";

            naviworks_base.scale.set(1.5, 1.5, 1.5);
            scene.add(naviworks_base);
            collidableMeshList.push(naviworks_base);
        }
    );

    // interactbox
    box = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3, 3, 3, 3),
        new THREE.MeshBasicMaterial({ color: 0x808080, wireframe: false })
    );
    box.name = "intaebox";
    box.position.set(20, 3, 50);
    scene.add(box);
    interactableMeshList.push(box);

}   // EOF init()

function animate() {
    requestAnimationFrame(animate);
    stats.update();
    
    var delta = clock.getDelta();
    var pos = controls.getObject().position;

    raycasterCamera.setFromCamera( {x: 0, y: 0}, camera);
    var interacts = raycasterCamera.intersectObjects(interactableMeshList);
    if (interacts.length > 0) {
        if (INTERACTED != interacts[0].object) {
            if (INTERACTED) 
                INTERACTED.material.color.setHex(INTERACTED.currentHex);
            
            INTERACTED = interacts[0].object;
            INTERACTED.currentHex = INTERACTED.material.color.getHex();
            if (INTERACTED.name == "intaebox")
                INTERACTED.material.color.setHex(0xff0000);
        }
    } else {
        if (INTERACTED)
            INTERACTED.material.color.setHex(INTERACTED.currentHex);
        INTERACTED = undefined;
    }
    
    if (controlsEnabled === true) {
        velocity.x -= velocity.x * 10 * delta;
        velocity.z -= velocity.z * 10 * delta;
        velocity.y -= 9.8 * 100.0 * delta;
    
        direction.x = Number(moveLeft) - Number(moveRight);
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.normalize();
        
        collisionDetection(pos);

        if (moveLeft || moveRight)
            velocity.x -= direction.x * 100.0 * delta;
        if (moveForward || moveBackward)
            velocity.z -= direction.z * 100.0 * delta;

        // if (onObject === true) {
        //     velocity.y = Math.max(0, velocity.y);
        //     canJump = true;
        // }

        controls.getObject().translateX(velocity.x * delta);
        controls.getObject().translateY(velocity.y * delta);
        controls.getObject().translateZ(velocity.z * delta);

        if (pos.y < 10) {
            velocity.y = 0;
            pos.y = 2;
            canJump = true;
        }
    }
    
    
    switch (isGearVRGamepadPressed())
    {
        // touch button
        case 0:
            velocity.x -= velocity.x * 10 * delta;
            velocity.z -= velocity.z * 10 * delta;
            velocity.y -= 9.8 * 100.0 * delta;
        
            // get direction where I looking at
            var direct = new THREE.Vector3();
            camera.getWorldDirection(direct);
            direct.normalize();

            // collision dectection
            // raycaster.set(pos, direct);
            raycaster.setFromCamera({x:0, y:0}, camera);
            var intersects = raycaster.intersectObjects(collidableMeshList, true);
            if (intersects.length > 0 && intersects[0].distance < 2)
                break;
                //bounceBack(pos, direct);   // #todo

            velocity.x += direct.x * 100 * delta;
            velocity.z += direct.z * 100 * delta;

            controls.getObject().translateX( velocity.x * delta );
            controls.getObject().translateY( velocity.y * delta );
            controls.getObject().translateZ( velocity.z * delta );
            
            if (pos.y < 10) {
                velocity.y = 0;
                pos.y = 2;
                canJump = true;
            }

            break;

        // trigger
        case 1:
            playSound();
            
            break;

        default:
            break;
    }
    
    // lights
    var time = performance.now() * 0.001;
    pointLight.position.x = 30 + Math.sin(time) * 9;
    pointLight.position.y = 50 + Math.sin(time * 1.1) * 9 + 5;
    pointLight.position.z = 50 + Math.sin(time * 1.2) * 9;

    time += 1000;

    pointLight2.position.x = 30 + Math.sin(time) * 9;
    pointLight2.position.y = 30 + Math.sin(time * 1.1) * 9 + 5;
    pointLight2.position.z = 30 + Math.sin(time * 1.2) * 9;

    // rotateObject(textMesh);
    box.rotation.y -= 0.01;
    //textMesh.rotation.y -= 0.01;
    
    renderer.render(scene, camera);
}   // EOF animate()


/***********************/
/*   GLOBAL FUNCTIONS  */
/***********************/

function switchMouse() {
    // ask the browser to lock the pointer
    element.requestPointerLock = 
        element.requestPointerLock      ||
        element.mozRequestPointerLock   ||
        element.webkitRequestPointerLock;

    element.requestPointerLock();
}

function playSound() {
    var sound = document.getElementById('sound');
    sound.play();
}
function playMusic() {
    var music = document.getElementById('bgmusic');
    music.play();
}


function isGearVRGamepadPressed() {
    gamepads = navigator.getGamepads && navigator.getGamepads();
    if (!gamepads[0])
        return false;
    var buttons = gamepads[0].buttons;
    var arrIndex = undefined;
    buttons.some((elem, index) => {
        if (elem.pressed === true) {
            arrIndex = index;
            return true;
        }
    });
    return arrIndex;
}

function bounceBack(pos, ray) {
    pos.x -= ray.bounceDistance.x;
    pos.y -= ray.bounceDistance.y;
    pos.z -= ray.bounceDistance.z;
}

var collisionDetection = function (pos) {
    // collision detection
    for (var index = 0; index < directionList.length; index++) {
        var bounceSize = 0.07;
        directionList[index].bounceDistance = {
            x: directionList[index].x * bounceSize,
            y: directionList[index].y * bounceSize,
            z: directionList[index].z * bounceSize
        };
        raycaster.set(pos, directionList[index]);
        var intersects = raycaster.intersectObjects(collidableMeshList, true);

        if (intersects.length > 0 && intersects[0].distance < 1.5) {
            bounceBack(pos, directionList[index]);
        }
    }
}