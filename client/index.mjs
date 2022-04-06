import * as alt from 'alt-client';
import * as native from 'natives';


var binActive = false;
var binZoom = 0;
var binRotHor = 0;
var binRotVer = 0;
var binDis = 0;

const binMaxHor = 40;
const binMaxVer = 20;
const binZoomSpeed = 0.1;
const binMoveSpeed = 0.4;

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
        if (binActive) {
            stopBinoculars();
        }
    }
    if (key == 66 && alt.gameControlsEnabled()) {
        if (!binActive && !native.isPedInAnyVehicle(alt.Player.local.scriptID, true)) {
            startBinoculars();
        }
    }
});


//Events für Einbindung in andere Resoruces
alt.on("startBinoculars", () => {
    startBinoculars();
});

alt.on("stopBinoculars", () => {
    stopBinoculars();
});


//Input Management
alt.everyTick(() => {
    if (binActive) {
        //INPUT_WEAPON_WHEEL_NEXT -> Mousewheel Down
        if(native.isControlPressed(0, 14)) {
            binZoom -= binZoomSpeed;
            if (binZoom < 0) {
                binZoom = 0;
            }
            updateCam();
        }
        //INPUT_WEAPON_WHEEL_PREV -> Mousewheel Up
        if(native.isControlPressed(0, 15)) {
            binZoom += binZoomSpeed;
            if (binZoom > 1) {
                binZoom = 1;
            }
            updateCam();
        }
        //INPUT_MOVE_LEFT_ONLY -> A
         if(native.isControlPressed(0, 34)) {
            binRotHor += binMoveSpeed / (4 * binZoom + 1);
            if (binRotHor > binMaxHor) {
                binRotHor = binMaxHor;
            }
            updateCam();
        }
        //INPUT_MOVE_RIGHT_ONLY -> D
        if(native.isControlPressed(0, 35)) {
            binRotHor -= binMoveSpeed / (4 * binZoom + 1);
            if (binRotHor < -binMaxHor) {
                binRotHor = -binMaxHor;
            }
            updateCam();
        }
        //INPUT_MOVE_UP_ONLY -> W
        if(native.isControlPressed(0, 32)) {
            binRotVer += binMoveSpeed / (4 * binZoom + 1);
            if (binRotVer > binMaxVer) {
                binRotVer = binMaxVer;
            }
            updateCam();
        }
        //INPUT_MOVE_DOWN_ONLY -> S
        if(native.isControlPressed(0, 33)) {
            binRotVer -= binMoveSpeed / (4 * binZoom + 1);
            if (binRotVer < -binMaxVer) {
                binRotVer = -binMaxVer;
            }
            updateCam();
        }
        //Disable Weapon Wheel
        native.blockWeaponWheelThisFrame();
    }
});

function startBinoculars() {
    if (!binActive) {
        binActive = true;
        cef.isVisible = true;

        //Disable Mini Map
        native.displayRadar(false);

        playAnimation("oddjobs@hunter", "binoculars_loop", -1, 1, 1.0);
        playerPos = alt.Player.local.pos;
        playerRot = alt.Player.local.rot;

        var camPos = playerPos + alt.Player.local.pos.forward * 2;
        cam = native.createCam("DEFAULT_SCRIPTED_CAMERA",true); 
        native.setCamCoord(cam, playerPos.x, playerPos.y, playerPos.z + 1);
        updateCam();
        native.renderScriptCams(true, false, 0, 0, 0, 0);
    } 
}

function stopBinoculars() {
    if (binActive) {
        binActive = false;
        binZoom = 0;
        binRotHor = 0;
        binRotVer = 0;

        //Enable Mini Map
        native.displayRadar(true);

        cef.isVisible = false;
        stopAnimation();
        native.renderScriptCams(false, false, 0, 0, 0, 0);
        native.destroyCam(cam, true);
    }
}

function updateCam() {
    native.setCamFov(cam, 45 - 40 * binZoom);
    native.setCamRot(cam, 0 + binRotVer, 0, (playerRot.z * 180 / Math.PI) + binRotHor, 2);
    cef.emit("updateZoom", [binZoom]);
}

function playAnimation(dict, name, duration, flag, speed) {
    native.requestAnimDict(dict);
    var maxWait = 0;
    while(!native.hasAnimDictLoaded(dict)) {
        if (maxWait >= 10) {
            alt.emitServer("fail");
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