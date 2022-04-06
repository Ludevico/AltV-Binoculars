import * as alt from 'alt-client';
import * as native from 'natives';


var active = false;
var zoom = 0;
var rotationHorizontal = 0;
var rotationVertical = 0;

const maxRotationHorizontal = 40;
const maxRotationVertical = 20;
const zoomSpeed = 0.1;
const moveSpeed = 0.4;

var cam;
var playerPos;
var playerRot;

const cef = new alt.WebView("http://resource/client/html/index.html");

cef.on("load", () => {
    cef.isVisible = false;
});


//Zum Test gerade Start mit B und Stop mit U
alt.on("keyup", (key) => {
    if (key == 85 && alt.gameControlsEnabled()) {
        if (active) {
            stopBinoculars();
        }
    }
    if (key == 66 && alt.gameControlsEnabled()) {
        if (!active && !native.isPedInAnyVehicle(alt.Player.local.scriptID, true)) {
            startBinoculars();
        }
    }
});


//Events für Einbindung in andere Resoruces
alt.on("StartBinoculars", () => {
    startBinoculars();
});

alt.on("StopBinoculars", () => {
    stopBinoculars();
});


//Input Management
alt.everyTick(() => {
    if (active) {
        //INPUT_WEAPON_WHEEL_NEXT -> Mousewheel Down
        if(native.isControlPressed(0, 14)) {
            zoom -= zoomSpeed;
            if (zoom < 0) {
                zoom = 0;
            }
            updateCam();
        }
        //INPUT_WEAPON_WHEEL_PREV -> Mousewheel Up
        if(native.isControlPressed(0, 15)) {
            zoom += zoomSpeed;
            if (zoom > 1) {
                zoom = 1;
            }
            updateCam();
        }
        //INPUT_MOVE_LEFT_ONLY -> A
         if(native.isControlPressed(0, 34)) {
            rotationHorizontal += moveSpeed / (4 * zoom + 1);
            if (rotationHorizontal > maxRotationHorizontal) {
                rotationHorizontal = maxRotationHorizontal;
            }
            updateCam();
        }
        //INPUT_MOVE_RIGHT_ONLY -> D
        if(native.isControlPressed(0, 35)) {
            rotationHorizontal -= moveSpeed / (4 * zoom + 1);
            if (rotationHorizontal < -maxRotationHorizontal) {
                rotationHorizontal = -maxRotationHorizontal;
            }
            updateCam();
        }
        //INPUT_MOVE_UP_ONLY -> W
        if(native.isControlPressed(0, 32)) {
            rotationVertical += moveSpeed / (4 * zoom + 1);
            if (rotationVertical > maxRotationVertical) {
                rotationVertical = maxRotationVertical;
            }
            updateCam();
        }
        //INPUT_MOVE_DOWN_ONLY -> S
        if(native.isControlPressed(0, 33)) {
            rotationVertical -= moveSpeed / (4 * zoom + 1);
            if (rotationVertical < -maxRotationVertical) {
                rotationVertical = -maxRotationVertical;
            }
            updateCam();
        }
        //Disable Weapon Wheel
        native.blockWeaponWheelThisFrame();
    }
});

function startBinoculars() {
    if (!active) {
        active = true;
        cef.isVisible = true;

        //Disable Mini Map
        native.displayRadar(false);

        //Player invisible locally
        native.setEntityAlpha(alt.Player.local.scriptID, 0, false);

        playAnimation("oddjobs@hunter", "binoculars_loop", -1, 1, 1.0);
        playerPos = alt.Player.local.pos;
        playerRot = alt.Player.local.rot;

        var camPos = playerPos + alt.Player.local.pos.forward * 2;
        cam = native.createCam("DEFAULT_SCRIPTED_CAMERA",true); 
        native.setCamCoord(cam, playerPos.x, playerPos.y, playerPos.z + 0.7);
        updateCam();
        native.renderScriptCams(true, false, 0, 0, 0, 0);
    } 
}

function stopBinoculars() {
    if (active) {
        active = false;
        zoom = 0;
        rotationHorizontal = 0;
        rotationVertical = 0;

        //Enable Mini Map
        native.displayRadar(true);

        //Player invisible locally
        native.setEntityAlpha(alt.Player.local.scriptID, 255, false);

        cef.isVisible = false;
        stopAnimation();
        native.renderScriptCams(false, false, 0, 0, 0, 0);
        native.destroyCam(cam, true);
    }
}

function updateCam() {
    native.setCamFov(cam, 45 - 40 * zoom);
    native.setCamRot(cam, 0 + rotationVertical, 0, (playerRot.z * 180 / Math.PI) + rotationHorizontal, 2);
    cef.emit("UpdateZoom", [zoom]);
}

function playAnimation(dict, name, duration, flag, speed) {
    native.requestAnimDict(dict);
    var maxWait = 0;
    while(!native.hasAnimDictLoaded(dict)) {
        if (maxWait >= 10) {
            return;
        }
        setTimeout(()=>{}, 100);
        maxWait++;
    }
    native.taskPlayAnim(alt.Player.local.scriptID, dict, name, 8.0, 1.0, duration, flag, speed, false, false, false);
}

function stopAnimation () {
    native.stopAnimPlayback(alt.Player.local.scriptID, 0, 0);
}