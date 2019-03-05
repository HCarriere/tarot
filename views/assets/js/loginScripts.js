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
        MAX_PARTICLES: 500,
        MOUSE_FEAR_SPEED: 0.2,
        MOUSE_FEAR_DIST: 80,
        PARTICLE_REFLEX: 0.02,
        DECAY_MIN: 100,
        DECAY_MAX: 300,
        MASTER_PARTICLE_MAX: 20,
        MASTER_PARTICLE_FREQ: 2,
        MASTER_PARTICLE_MAX_SPEED: 3,
        OBJECTIVE_RAD_SPEED: 0.05,
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
        canvas.ontouchcancel = event => onTouchEnd(event); 

        width = canvas.width = (window.innerWidth);
        height = canvas.height = (window.innerHeight);

        objective = {
            x:0, y:0,
            rad: 0,
        }
        objective.x = width/2 + Math.cos(objective.rad) * (180 / Math.PI) * 2;
        objective.y = height/2 + Math.sin(objective.rad) * (180 / Math.PI) * 2;
        masterParticles = [];
        masterParticle = {
            x: objective.x, y:objective.y,
            vx: 0, vy: 0,
        };

        particles = getParticleSystem();

        resizeCanvas();
        setTimeout(()=>{
            run();
        }, 500);
    }

    function stop() {
        stopped = true;
        console.log('stopping loading screen');

        let canvas = document.getElementById('loadingScreen');
        canvas.style.display = 'none'; 
        let loginForm = document.getElementById('loginForm');
        // loginForm.style.display = 'block';
        fadeIn(loginForm);
    }

    function run() {
        particlesToRemove = [];
        ctx.clearRect(0, 0, width, height);
        delta = 60 / getFPS() || 1;
        
        // master particle
        if(mouse.pressed) moveToObjective(masterParticle, mouse.x, mouse.y);
        else moveToObjective(masterParticle, objective.x, objective.y);
        moveFromWalls(masterParticle);
        /*if(isNear(masterParticle, objective.x, objective.y, 30)) {
            objective = getObjective(); // new objective
        }*/
        objective.rad += CONST.OBJECTIVE_RAD_SPEED;
        objective.x = width/2 + Math.cos(objective.rad) * (180 / Math.PI) * 2;
        objective.y = height/2 + Math.sin(objective.rad) * (180 / Math.PI) * 2;

        if(frameCount%CONST.MASTER_PARTICLE_FREQ == 0) {
            masterParticles.push({x: masterParticle.x, y: masterParticle.y});
            if(masterParticles.length > CONST.MASTER_PARTICLE_MAX) {
                masterParticles.shift();
            }
        }
        // cap speed
        normParticleSpeed(masterParticle, CONST.MASTER_PARTICLE_MAX_SPEED);
        // move master particles
        masterParticle.x += masterParticle.vx * delta;
        masterParticle.y += masterParticle.vy * delta;

        // (display)
        /*for(let particle of masterParticles) {
            ctx.fillStyle = 'red';
            ctx.fillRect(Math.floor(particle.x), Math.floor(particle.y), 20, 20);
        }
        ctx.fillStyle = 'green';
        ctx.fillRect(Math.floor(objective.x), Math.floor(objective.y), 20, 20);
        ctx.fillStyle = 'blue';
        ctx.fillRect(Math.floor(masterParticle.x), Math.floor(masterParticle.y), 20, 20);//*/

        // move & display particles
        for(let i=0;i<particles.length;i++) {
            let particle = particles[i];

            //if(mouse.pressed) moveAwayFromMouse(particle);
            let s = Math.floor(map(particle.decay, 0, CONST.DECAY_MAX, 1, CONST.COLORS.length, true));

            // move to master
            moveToPoint(particle, masterParticle.x, masterParticle.y);

            normParticleSpeed(particle, (12-s)/5);

            // move particles
            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;

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
        for(let i=0; i<constrain(CONST.MAX_PARTICLES - particles.length, 0, 4) ; i++) {
            particles.push(getNewParticle());
        }

        /*ctx.textAlign = 'center';
        ctx.font = '50px Calibri';
        ctx.fillStyle = 'black';
        ctx.fillText('Chargement ...', width/2, height/2);*/

        frameCount++;
        requestAnimationFrame(run);
    }

    function moveToPoint(particle, x, y) {
        if(particle.x < x) particle.vx += CONST.PARTICLE_REFLEX;
        if(particle.x > x) particle.vx -= CONST.PARTICLE_REFLEX;
        if(particle.y > y) particle.vy -= CONST.PARTICLE_REFLEX;
        if(particle.y < y) particle.vy += CONST.PARTICLE_REFLEX;
    }
    // more precise than moveToPoint
    function moveToObjective(particle, x, y) {
        let d = dist(particle.x, x,particle.y, y);
        let speed = map(d, 0, 500, 0.01, 0.5);
        let dx = x - particle.x;
        let dy = y - particle.y;
        particle.vx += (dx/100) * speed;
        particle.vy += (dy/100) * speed;
        if(d <= 8) {
            particle.x = x;
            particle.y = y;
            particle.vx /= 10;
            particle.vy /= 10;
        }
    }

    function normParticleSpeed(particle, maxSpeed) {
        // constrain vector speed
        let mag = particle.vx * particle.vx + particle.vy * particle.vy;
        if (mag > maxSpeed * maxSpeed) {

            // normalizing vector
            mag = Math.sqrt(mag);
            particle.vx /= mag;
            particle.vy /= mag;
            // mult by max speed
            particle.vx *= maxSpeed;
            particle.vy *= maxSpeed;
        }
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

    function dist(x1, x2, y1, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
    }
    /**
     * Init the particle system
     * @return {ParticleSystem}
     */
    function getParticleSystem() {
        if(masterParticles.length == 0) return [];
        let newParticles = [];
        /*for(let i=0; i<CONST.MAX_PARTICLES; i++) {
            newParticles.push(getNewParticle());
        }*/
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
        mouse.pressed = false;
    }

    function resizeCanvas() {
        width = canvas.width = (window.innerWidth);
        setTimeout(() => {
            height = canvas.height = (window.innerHeight);
        }, 0);
    }

    /**
     * No jquery !
     * @param {HTMLElement} element 
     */
    function fadeIn(element) {
        var op = 0;  // initial opacity
        element.style.display = 'block';
        element.style.filter = 'alpha(opacity=0)';
        var timer = setInterval(function () {
            if (op >= 0.9){
                clearInterval(timer);
            }
            element.style.opacity = op;
            element.style.filter = 'alpha(opacity=' + op * 100 + ")";
            op += 0.1;
        }, 50);
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