'use strict';

function getLoadingScreen() {
    let stopped = false;

    let canvas;
    let ctx;
    let frameCount = 0;
    let width;
    let height;
    let mouse = {x:0, y:0, pressed: false};
    let lastAnimationTime;
    let delta;

    let CONST = {
        MAX_PARTICLES: 800,
        MOUSE_FEAR_SPEED: 0.2,
        MOUSE_FEAR_DIST: 80,
        PARTICLE_REFLEX: 0.01,
        DECAY_MIN: 100,
        DECAY_MAX: 300,
        MASTER_PARTICLE_MAX: 100,
        MASTER_PARTICLE_FREQ: 2,
        MASTER_PARTICLE_MAX_SPEED: 2,
        COLORS: [ '#56c2b8','#4ebdb2','#46b7ac','#3db2a7','#34ada1','#2ea99d','#28a599','#22a195','#1f9d91','#1c998d','#19968a'],
    }

    /** @type {Array} */
    let particles;
    /** @type {Array} */
    let particlesToRemove;
    /** @type {Array} */
    let masterParticles;
    let masterParticle;
    let objective;

    function start() {
        if(stopped) return;
        console.log('starting loading screen ...');

        canvas = document.getElementById('loadingScreen');
        canvas.style.display = 'inline-block'; 
        let loginForm = document.getElementById('loginForm');
        loginForm.style.display = 'none';
        
        /** @type {CanvasRenderingContext2D} */
        ctx = canvas.getContext('2d');

        window.onresize = resizeCanvas;
        canvas.onmousemove = event => onMouseMove(event);
        canvas.onmousedown = event => onMouseDown(event);
        canvas.onmouseup = event => onMouseUp(event);
        canvas.ontouchmove = event => onTouchMove(event);
        canvas.ontouchstart = event => onTouchStart(event);
        canvas.ontouchend = event => onTouchEnd(event); 
        width = canvas.width = (window.innerWidth);
        height = canvas.height = (window.innerHeight);

        masterParticles = [];
        masterParticle = {
            x: width/2, y: width/2,
            vx: 0, vy: 0,
        };
        objective = getObjective();
    
        particles = getParticleSystem();

        resizeCanvas();
        run();
    }

    function stop() {
        stopped = true;
        console.log('stopping loading screen');

        let canvas = document.getElementById('loadingScreen');
        canvas.style.display = 'none'; 
        let loginForm = document.getElementById('loginForm');
        loginForm.style.display = 'block';
    }

    function run() {
        particlesToRemove = [];
        ctx.clearRect(0, 0, width, height);
        delta = 60 / getFPS() || 1;
        
        // master particle
        moveToPoint(masterParticle, objective.x, objective.y);
        moveFromWalls(masterParticle);
        if(isNear(masterParticle, objective.x, objective.y, 30)) {
            objective = getObjective(); // new objective
        }
        if(frameCount%CONST.MASTER_PARTICLE_FREQ == 0) {
            masterParticles.push({x: masterParticle.x, y: masterParticle.y});
            if(masterParticles.length > CONST.MASTER_PARTICLE_MAX) {
                masterParticles.shift();
            }
        }
        // cap speed
        if(masterParticle.vx > CONST.MASTER_PARTICLE_MAX_SPEED) masterParticle.vx = CONST.MASTER_PARTICLE_MAX_SPEED;
        if(masterParticle.vx < -CONST.MASTER_PARTICLE_MAX_SPEED) masterParticle.vx = -CONST.MASTER_PARTICLE_MAX_SPEED;
        if(masterParticle.vy > CONST.MASTER_PARTICLE_MAX_SPEED) masterParticle.vy = CONST.MASTER_PARTICLE_MAX_SPEED;
        if(masterParticle.vy < -CONST.MASTER_PARTICLE_MAX_SPEED) masterParticle.vy = -CONST.MASTER_PARTICLE_MAX_SPEED;
        // move master particles
        masterParticle.x += masterParticle.vx * delta;
        masterParticle.y += masterParticle.vy * delta;
        // (display)
        /*for(let particle of masterParticles) {
            ctx.fillStyle = 'red';
            ctx.fillRect(Math.floor(particle.x), Math.floor(particle.y), 20, 20);
        }
        ctx.fillStyle = 'blue';
        ctx.fillRect(Math.floor(masterParticle.x), Math.floor(masterParticle.y), 20, 20);
        ctx.fillStyle = 'green';
        ctx.fillRect(Math.floor(objective.x), Math.floor(objective.y), 20, 20);*/

        // move & display particles
        for(let i=0;i<particles.length;i++) {
            let particle = particles[i];

            if(mouse.pressed) moveAwayFromMouse(particle);

            // move to master
            moveToPoint(particle, masterParticle.x, masterParticle.y);

            // move particles
            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;

            let s = Math.floor(map(particle.decay, 0, CONST.DECAY_MAX, 1, CONST.COLORS.length, true));

            // display
            ctx.fillStyle = CONST.COLORS[Math.floor(s)];
            ctx.fillRect(Math.floor(particle.x), Math.floor(particle.y), s, s);

            // decaying
            particle.decay--;
            if(particle.decay <= 0) {
                particlesToRemove.push(i);
            }
        }

        // remove particles
        for(let i=particlesToRemove.length-1; i>0; i--) {
            particles.splice(particlesToRemove[i], 1);
        }
        for(let i=0; i<CONST.MAX_PARTICLES - particles.length; i++) {
            particles.push(getNewParticle());
        }

        ctx.textAlign = 'center';
        ctx.font = '50px Impact';
        ctx.fillStyle = 'black';
        ctx.fillText('Patientez ...', width/2, height/2);

        frameCount++;
        requestAnimationFrame(run);
    }

    function moveToPoint(particle, x, y) {
        if(particle.x < x) particle.vx += CONST.PARTICLE_REFLEX;
        if(particle.x > x) particle.vx -= CONST.PARTICLE_REFLEX;
        if(particle.y > y) particle.vy -= CONST.PARTICLE_REFLEX;
        if(particle.y < y) particle.vy += CONST.PARTICLE_REFLEX;
    }

    function moveFromWalls(particle) {
        if(particle.x < 50) particle.vx += CONST.PARTICLE_REFLEX*2;
        if(particle.x > width-50) particle.vx -= CONST.PARTICLE_REFLEX*2;
        if(particle.y < 100) particle.vy += CONST.PARTICLE_REFLEX*2;
        if(particle.y > height-100) particle.vy -= CONST.PARTICLE_REFLEX*2;
    }

    function moveAwayFromMouse(particle) {
        if(isNear(particle, mouse.x, mouse.y, CONST.MOUSE_FEAR_DIST)) {
            if(particle.x > mouse.x) particle.vx += CONST.MOUSE_FEAR_SPEED;
            if(particle.x < mouse.x) particle.vx -= CONST.MOUSE_FEAR_SPEED;
            if(particle.y > mouse.y) particle.vy += CONST.MOUSE_FEAR_SPEED;
            if(particle.y < mouse.y) particle.vy -= CONST.MOUSE_FEAR_SPEED;
        } 
    }

    function isNear(particle, x, y, dist) {
        if(particle.x > x - dist && particle.x < x + dist
            && particle.y > y - dist && particle.y < y + dist) {
            return true;
        }
    }

    function map(n, start1, stop1, start2, stop2, withinBounds) {
        var newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
        if (!withinBounds) {
            return newval;
        }
        if (start2 < stop2) {
            return constrain(newval, start2, stop2);
        } else {
            return constrain(newval, stop2, start2);
        }
    }

    function constrain(value, min, max) {
        if (value > max) return max;
        if (value < min) return min;
        return value;
    }

    /**
     * Init the particle system
     * @return {ParticleSystem}
     */
    function getParticleSystem() {
        if(masterParticles.length == 0) return [];
        let newParticles = [];
        for(let i=0; i<CONST.MAX_PARTICLES; i++) {
            newParticles.push(getNewParticle());
        }
        return newParticles;
    }

    function getNewParticle() {
        let master = Math.floor(Math.random()*masterParticles.length);
        return {
            x: masterParticles[master].x,
            y: masterParticles[master].y,
            vx: Math.random()-0.5,
            vy: Math.random()-0.5,
            decay: CONST.DECAY_MIN + Math.floor(Math.random()*(CONST.DECAY_MAX - CONST.DECAY_MIN)),
        };
    }

    function getObjective() {
        return {
            x:Math.random()*width,
            y:Math.random()*height,
        }
    }

    function getFPS() {
        let now = performance.now();
        let diff = now - lastAnimationTime;
        lastAnimationTime = now;
        return (1/diff)*1000;
    }

    function onMouseMove(event) {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    }  
    function onMouseUp(event) {
        //event.preventDefault();
        mouse.pressed = false;
    }  
    function onMouseDown(event) {
        //event.preventDefault();
        mouse.pressed = true;
    }

    function onTouchMove(event) {
        event.preventDefault();
        if(event.changedTouches.length > 0) {
            mouse.x = event.changedTouches[0].pageX;
            mouse.y = event.changedTouches[0].pageY;
        }
    }
    function onTouchStart(event) {
        event.preventDefault();
        if(event.changedTouches.length > 0) mouse.pressed = true;
    }
    function onTouchEnd(event) {
        event.preventDefault();
        if(event.changedTouches.length == 0) mouse.pressed = false;
    }

    function resizeCanvas() {
        width = canvas.width = (window.innerWidth);
        setTimeout(() => {
            height = canvas.height = (window.innerHeight);
        }, 0);
    }

    return {
        start: start,
        stop: stop,
    }
}


document.addEventListener("DOMContentLoaded", (event) => {
    console.log('dom loaded');

    let loadingScreen = getLoadingScreen();

    loadingScreen.start();
    
    testConnection(() => {
        console.log('server up and running');
        loadingScreen.stop();
    });
});





function testConnection(connected) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            connected();
        }
    };
    xhttp.open("GET", "/ping", true);
    xhttp.send();
}