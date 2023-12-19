const canvas = document.getElementById('page');
const ctx = canvas.getContext('2d');

// toggle modes, default settings
toggleGrid = false;
imageMode = true;
showImage = false;
textMode = false;
showText = false;

class Particle {
    constructor(particleEffect) {
        /* PARTICLE MODIFIERS */
        this.speedModifier = Math.floor(Math.random() * 2) + 1; // higher values = faster
        this.maxLength = Math.floor(Math.random() * 60) + 10; // higher values = longer lines, also slower
        
        // flow properties
        this.currentAngle = 0;
        this.colorAngle = 0;
        
        this.resetValues(); // particle duration and particlePosition array

        // color codes of the text particles
        this.colorHexCodes = ['#fc0303', '#ff3838', '#ff6666', '#940000', '#8a2121', '#752e2e'];
        this.textParticleColor = this.colorHexCodes[Math.floor(Math.random() * this.colorHexCodes.length)];

        // color values for image particles, updates based on rgb values
        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.imageParticleColor = 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';

        // particle properties from the Effect class
        this.particleEffect = particleEffect;
        this.particleWidth = Math.floor(Math.random() * this.particleEffect.width);
        this.particleHeight = Math.floor(Math.random() * this.particleEffect.height);

        // randomly makes a longer/wider particle line
        if (Math.random() > 0.99){
            this.maxLength = Math.floor(Math.random() * 60 + 110);
            this.lineWidth = 4;
        }
    }

    // draws the particle lines
    draw() {
        if (imageMode){
            // saves the ctx values so they don't get overwritten
            ctx.save();
            // starts the line at the particle's initial position
            ctx.beginPath();
            ctx.moveTo(this.particlePosition[0].x, this.particlePosition[0].y);
    
            // draws the line based on the length of the particle
            for (let i = 0; i < this.particlePosition.length; i++){
                ctx.lineTo(this.particlePosition[i].x, this.particlePosition[i].y);
            }
    
            // add a shadow to the random longer lines
            if (this.maxLength > 120){
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 4;
                ctx.shadowColor = 'black';
            }
            ctx.strokeStyle = this.imageParticleColor; // sets the color to the particle on the image
            ctx.lineWidth = this.lineWidth;
            ctx.stroke(); // draws the line on the canvas
            ctx.restore(); // restores the ctx settings
        }
        else if (textMode){
            // starts the line at the particle's initial position
            ctx.beginPath();
            ctx.moveTo(this.particlePosition[0].x, this.particlePosition[0].y);

            // draws the line based on the length of the particle
            for (let i = 0; i < this.particlePosition.length; i++){
                ctx.lineTo(this.particlePosition[i].x, this.particlePosition[i].y);
            }
    
            ctx.strokeStyle = this.textParticleColor;
            ctx.stroke(); // draws the line on the canvas
        }
    }

    // updates everything necessary for the particle
    update() {
        this.particleDuration--;

        if (this.particleDuration >= 1){
            let particleRow = Math.floor(this.particleWidth / this.particleEffect.cellSize); // x position of the particle
            let particleCol = Math.floor(this.particleHeight / this.particleEffect.cellSize); // y position of the particle
            let index = particleCol * this.particleEffect.gridCols + particleRow; // Finds the position 

            // particle at that index
            this.particleFlowIndex = this.particleEffect.particleFlow[index];

            if (this.particleFlowIndex){
                this.flowUpdate();

                // gets the rgb values of the pixel in order to match any image
                if (imageMode){
                     if (this.particleFlowIndex.alpha > 0){
                        this.red === this.particleFlowIndex.red ? this.red : this.red += (this.particleFlowIndex.red - this.red) * 0.1;
                        this.green === this.particleFlowIndex.green ? this.green : this.green += (this.particleFlowIndex.green - this.green) * 0.1;
                        this.blue === this.particleFlowIndex.blue ? this.blue : this.blue += (this.particleFlowIndex.blue - this.blue) * 0.1;
                        this.imageParticleColor = 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';
                    }
                }
            }
    
            /* Makes the lines curve based on the angle.
            + values to the right, - values to the left */
            let speedX = Math.cos(this.currentAngle)
            let speedY = Math.sin(this.currentAngle);
    
            // Increase the x and y position based on the speed
            this.particleWidth += speedX * this.speedModifier;
            this.particleHeight += speedY * this.speedModifier;
    
            this.particlePosition.push({x: this.particleWidth, y: this.particleHeight}); // adds a new element to the end of the array
            if (this.particlePosition.length > this.maxLength) {
                this.particlePosition.shift(); // removes an element from the beginning of the array
            }
        }
        else if (this.particlePosition.length > 1){
            this.particlePosition.shift(); // removes an element from the beginning of the array
        } 
        else {
            this.reset();
        }
    }

    // updates the direction that the particle flows
    flowUpdate() {
        // The angle that the particle needs to move, based on the current position
        this.colorAngle = this.particleFlowIndex.curveColor;

        // adjusts the angle the particle is flowing based on the color
        if (this.currentAngle != this.colorAngle){
            this.currentAngle += (this.colorAngle - this.currentAngle) * 0.08;
        }
    }

    // updates the particle to new values
    resetValues() {
        // stores the new particles position in an array
        this.particlePosition = [{x: this.particleWidth, y: this.particleHeight}];
        this.particleDuration = this.maxLength * 2;
    }

    // resets the last particle to make the flow loop endlessly
    reset() {
        let attempts = 0;
        let resetSuccess = false;

        // keeps looping as long as particles are generated in the text/image
        while (attempts < 50 && !resetSuccess) {
            attempts++;
            let randomIndex = Math.floor(Math.random() * this.particleEffect.particleFlow.length);

            // if the particle has found a color value (anything not on the black background has an alpha value)
            if (this.particleEffect.particleFlow[randomIndex].alpha > 0) {
                this.particleWidth = this.particleEffect.particleFlow[randomIndex].x;
                this.particleHeight = this.particleEffect.particleFlow[randomIndex].y;
                this.resetValues();

                resetSuccess = true;
            }
        }
        /* if the particle hasn't found a color value at it's location, 
        give it new random x and y values */
        if (!resetSuccess) {
            this.particleWidth = Math.random() * this.particleEffect.width;
            this.particleHeight = Math.random() * this.particleEffect.height;
            this.resetValues();
        }
    }
}

class ParticleEffect {
    // constructor for the effect
    constructor() {
        /* PARTICLE EFFECT MODIFIERS */
        this.numberOfParticles = 3000; // how many particles get generated
        
        /* Alters the area that a particle can be created on the window, 
        smaller cellsize = more area = more accurate flow field */
        this.cellSize = 5;

        this.particles = [];
        this.image = document.getElementById('Fire-Wolf');
        this.init();
        this.actionEvents();
    }

    // initialize method to start the effect
    init() {
        // changes the canvas size to dynamically adapt to any cell size values
        canvas.height = Math.ceil(window.innerHeight / this.cellSize) * this.cellSize;
        canvas.width = Math.ceil(window.innerWidth / this.cellSize) * this.cellSize;

        this.particleArea();

        if (imageMode) this.displayImage();
        else if (textMode) this.displayText();
        
        // scan pixel data of the canvas
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        // goes left to right, then down to the next row
       for (let y = 0; y < canvas.height; y += this.cellSize){ // each 'row' of the grid
            for (let x = 0; x < canvas.width; x += this.cellSize){ // each 'col' of the grid
                const index = (y * canvas.width + x) * 4;

                // rgba(red, blue, green, alpha), every 4 indexes is a new pixel
                const red = pixels[index];
                const green = pixels[index + 1];
                const blue = pixels[index + 2];
                const alpha = pixels[index + 3];

                // rgab(x, x, x, 1) where x are all the same
                const grayscale = (red + green + blue) / 3;

                /* 6.28 in radians = 360 degrees in a circle
                maps the average color value and finds the angle to curve the particle */
                const curveColor = ((grayscale / 255) * 6.28).toFixed(2);

                // stores the pixel data in an array
                this.particleFlow.push({
                    x: x, 
                    y: y, 
                    red: red,
                    green: green,
                    blue: blue,
                    alpha: alpha,
                    curveColor: curveColor
                });
            }
        }

        // create particles
        this.particles = [];
        for (let i = 0; i < this.numberOfParticles; i++){
            this.particles.push(new Particle(this));
        }
        this.particles.forEach(particle => particle.reset());
    }

    // the area where particles can generate, inside the grid
    particleArea() {
        // grid area for where particles can generate
        this.gridRows = Math.floor(canvas.height / this.cellSize);
        this.gridCols = Math.floor(canvas.width / this.cellSize);

        this.particleFlow = [];
    }

    // particles flow around the text differently based on the text color
    displayText() {
        ctx.font = '350px Impact';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 10, canvas.width / 2, canvas.height / 2, canvas.width);
        gradient.addColorStop(0.0, 'rgb(0, 0, 200)');
        gradient.addColorStop(0.2, 'rgb(50, 150, 150)');
        gradient.addColorStop(0.4, 'rgb(125, 150, 100)');
        gradient.addColorStop(0.6, 'rgb(75, 100, 100)');
        gradient.addColorStop(0.7, 'rgb(75, 100, 255)');
        gradient.addColorStop(0.8, 'rgb(50, 25, 125)');

        ctx.fillStyle = gradient;
        ctx.fillText('Skylar', canvas.width / 2, canvas.height / 2, canvas.width * 0.8);
    }

    // centers the image and draws it on the canvas
    displayImage() {
        let x = canvas.width / 2 - this.image.width / 2;
        let y = canvas.height / 2 - this.image.height / 2;

        ctx.drawImage(this.image, x, y, this.image.width, this.image.height);
    }

    // displays the grid when 'g' is pressed, based on the 'cellSize' value
    displayGrid() {
        // saves the ctx values so they don't overwrite the flow lines
        ctx.save();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 0.3;

        for(let col = 0; col < this.gridCols; col++){
            ctx.beginPath();
            ctx.moveTo(this.cellSize * col, 0);
            ctx.lineTo(this.cellSize * col, canvas.height);
            ctx.stroke();
        }

        for(let row = 0; row < this.gridRows; row++){
            ctx.beginPath();
            ctx.moveTo(0, this.cellSize * row);
            ctx.lineTo(canvas.width, this.cellSize * row);
            ctx.stroke();
        }

        // restores the ctx values for the flow lines
        ctx.restore();
    }

    // handles the action events 
    actionEvents() {
     
        // shows the grid when clicking 'g'
        window.addEventListener('keydown', e => {
            if (e.key === 'g') toggleGrid = !toggleGrid;
        });

        // keydown events for switching the modes
        window.addEventListener('keydown', e => {
            // toggle to display the image 
            if (e.altKey && e.key === 'i') {
                e.preventDefault();
               showImage = !showImage;
            }

            // toggles the flow field on the image 
            else if (e.key === 'i') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                textMode = false;
                showText = false;
                // if it's not already in image mode, switch it and render the particles
                if (!imageMode) {
                    imageMode = !imageMode;
                    this.init();
                }
                else {
                    imageMode = !imageMode;
                }
            }    

            // toggle to display the text
            else if (e.altKey && e.key === 't') {
                e.preventDefault();
                showText = !showText;
            }

            // toggles the flow field on the text
            else if (e.key === 't') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                imageMode = false;
                showImage = false;
                // if it's not already in text mode, switch it and render the particles
                if (!textMode) {
                    textMode = !textMode;
                    this.init();
                }
                else {
                    textMode = !textMode;
                }
            }    
        });

        // dynamic window resizing
        window.addEventListener('resize', e => {
            let width = Math.ceil(e.target.innerWidth / this.cellSize) * this.cellSize;
            let height = Math.ceil(e.target.innerHeight / this.cellSize) * this.cellSize;

            this.resize(width, height);
        });
    }
    
    // resizes the canvas, works dynamically
    resize(width, height) {
        canvas.width = width;
        canvas.height = height;

        this.init();
    }

    // draws and updates the particles and background
    render() {
        if (toggleGrid) this.displayGrid();
        if (showImage && !textMode) this.displayImage();
        if (showText && !imageMode) this.displayText();

        this.particles.forEach(particle => {
           particle.draw() 
           particle.update();
        });
    }
}

const particleEffect = new ParticleEffect();

function start() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particleEffect.render();
    requestAnimationFrame(start);
}

start();