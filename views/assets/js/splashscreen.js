'use strict';

function getSplashscreen() {
    
    let canvas;
    let ctx;
    let frameCount = 0;
    let width;
    let height;
    let mouse = {x:0, y:0, pressed: false};
    let lastAnimationTime;
    let delta;

    /** @type {Array} */
    let particles;
    /** @type {Array} */
    let particlesToRemove;

    let CONST = {
        TURN_AROUND_SPEED : 0.05,
        ATTRACTED_NUMBER: 5,
        FLAME_DECAY_MIN: 80, // frames
        FLAME_DECAY_MAX: 160,
        RANDOM_X_SLIDE: 0.3,
        MAX_PARTICLES: 800,
        MOUSE_FEAR_SPEED: 0.2,
        MOUSE_FEAR_DIST: 80,
        COLORS: ['#f4ff00','#f8f000','#fbe100','#fcd200','#fcc400','#fdb500',
        '#fda500','#fc9600','#fe8000','#ff6600','#ff4600','#ff0000'], // yellow -> red
    }

    const message = '404';
    let messageAt = 0;

    function start(){
        canvas = document.getElementById('splashscreen');
        /** @type {CanvasRenderingContext2D} */
        ctx = canvas.getContext('2d');

        window.onresize = resizeCanvas;
        canvas.onmousemove = event => onMouseMove(event);
        canvas.onmousedown = event => onMouseDown(event);
        canvas.onmouseup = event => onMouseUp(event);
        canvas.ontouchmove = event => onTouchMove(event);
        canvas.ontouchstart = event => onTouchStart(event);
        canvas.ontouchend = event => onTouchEnd(event);
        canvas.ontouchcancel =  event => onTouchEnd(event);
        width = canvas.width = (window.innerWidth);
        height = canvas.height = (window.innerHeight);

        particles = getParticleSystem();
        resizeCanvas();
        run();
    }

    function run() {
        ctx.clearRect(0, 0, width, height);

        delta = 60 / getFPS();

        // text
        ctx.save();
        /*ctx.shadowColor = "#aaa";
        ctx.shadowOffsetY = -7 + Math.floor(Math.random() * 3 - 6);
        ctx.shadowOffsetX = Math.floor(Math.random() * 10 - 5);
        ctx.shadowBlur = 10;*/
        ctx.font = '50px Impact';
        let gradient = ctx.createLinearGradient(0, height/2, 0, height/2-40);
        gradient.addColorStop(0, `rgb(${Math.floor(Math.random()*50+200)},
            ${Math.floor(Math.random()*50+200)},
            ${Math.floor(Math.random()*20)})`);
        gradient.addColorStop(0.3, `rgb(${Math.floor(Math.random()*50+200)},
            ${Math.floor(Math.random()*1)},
            ${Math.floor(Math.random()*20)})`);
        gradient.addColorStop(0.95, `black`);
        ctx.fillStyle = gradient;
        ctx.textAlign = 'center';
        ctx.fillText(message.slice(0, messageAt), width/2, height/2);
        ctx.restore();

        if(frameCount%3 == 0 && messageAt < message.length) messageAt++;

        // particles
        particlesToRemove = [];
        for(let i=0;i<particles.length;i++) {
            let particle = particles[i];

            if(mouse.pressed) moveAwayFromMouse(particle);

            // random acceleration slide
            particle.vx += (Math.random()*(CONST.RANDOM_X_SLIDE)) - (CONST.RANDOM_X_SLIDE / 2);
            particle.vy -= Math.random() / 1000;
            // move particles
            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;
            // color
            let s = Math.floor(map(particle.decay, 0, CONST.FLAME_DECAY_MAX * 0.7, 0, CONST.COLORS.length-1, true));
            let c = CONST.COLORS.length - s;
                
            // show particles
            // ctx.fillStyle = CONST.COLORS_DARK[c];
            // ctx.fillRect(Math.floor(particle.x)-2, Math.floor(particle.y)-2, 9, 9);
            ctx.fillStyle = CONST.COLORS[c];
            ctx.fillRect(Math.floor(particle.x), Math.floor(particle.y), s, s);
            // decay
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
        frameCount++;
        requestAnimationFrame(run);
    }

    function moveFromWalls(particle) {
        if(particle.x < 20) particle.vx += CONST.TURN_AROUND_SPEED;
        if(particle.x > width-20) particle.vx -= CONST.TURN_AROUND_SPEED;
        if(particle.y < 20) particle.vy += CONST.TURN_AROUND_SPEED;
        if(particle.y > height-20) particle.vy -= CONST.TURN_AROUND_SPEED;
    }

    function moveAwayFromMouse(particle) {
        if(particle.x > mouse.x - CONST.MOUSE_FEAR_DIST && particle.x < mouse.x + CONST.MOUSE_FEAR_DIST
            && particle.y > mouse.y - CONST.MOUSE_FEAR_DIST && particle.y < mouse.y + CONST.MOUSE_FEAR_DIST) {
            if(particle.x > mouse.x) particle.vx += CONST.MOUSE_FEAR_SPEED;
            if(particle.x < mouse.x) particle.vx -= CONST.MOUSE_FEAR_SPEED;
            if(particle.y > mouse.y) particle.vy += CONST.MOUSE_FEAR_SPEED;
            if(particle.y < mouse.y) particle.vy -= CONST.MOUSE_FEAR_SPEED;
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
        let newParticles = [];
        for(let i=0; i<CONST.MAX_PARTICLES; i++) {
            newParticles.push(getNewParticle());
        }
        return newParticles;
    }

    function getNewParticle() {
        return {
            x:Math.random()*width,
            y:height,
            vx:0,
            vy:Math.random()*1-1.5,
            decay: Math.floor(Math.random() * (CONST.FLAME_DECAY_MAX - CONST.FLAME_DECAY_MIN)) 
                + CONST.FLAME_DECAY_MIN,
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

    return {
        start: start,
    }
}

document.addEventListener("DOMContentLoaded", (event) => {
    let splashscreen = getSplashscreen();
    splashscreen.start();
});