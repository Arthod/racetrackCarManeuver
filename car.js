var key;

class Car {
    static aliveAmount;
    static w = 40;
    static h = 20;
    static sensorsMaxDist = 500;
    static sensors = [-0.25, -1.25, 0.25, 1.25];
    static sensorsAccuracy = 1; // The larger the less precise

    static accSpeed = 0.25;   // How fast the car can accelerate
    static angularDrag = 0.8;   // How fast the car stops spinning
    static turnSpeed = 300   // How fast the car can turn
    static drag = 0.94;

    static DEBUGCHECK = false;

    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        
        // Drive properties
        this.xVel = 0
        this.yVel = 0
        this.angle = angle;
        this.angularVel = 0;

        this.alive = true;
        this.fitness = 0;
        this.visited = [];

        this.sensorsRange = [0, 0, 0, 0, 0, 0];

        // MLP:
        // Input is sensors range and speed.
        // Output is turn left, turn right, speed up or brake.
        this.brain = new MLP(8, 6, 4);

        this.playerControlled = true;
    }

    tick(keysPressed, barriersMap, time, timeout) {
        if (this.alive) {
            this.sensorsRange = this.getSensorDistances(barriersMap);
            
            this.x += this.xVel;
            this.y += this.yVel;
            this.xVel = this.xVel * Car.drag//Math.max(this.xVel * Car.drag, 0.0001);
            this.yVel = this.yVel * Car.drag//Math.max(this.yVel * Car.drag, 0.0001);
            this.angle += this.angularVel;
            this.angularVel = this.angularVel * Car.angularDrag// Math.max(this.angularVel * Car.angularDrag, 0.0001);
            
            let i = (Math.floor(this.y) * 960 + Math.floor(this.x)) * 4;
            let data = barriersMap.data;
            
            let r = data[i], 
                g = data[i + 1],
                b = data[i + 2],
                t = data[i + 3];
            // Death
            
            if (((this.x < 0 && this.y > 300) || this.x > 960) || (this.y < 0 || this.y > 960)) { // Death by restriction
                this.alive = false;
                Car.aliveAmount--;
                this.fitness += (1 - (time / timeout)) * this.fitness;
            } 
            else if (r == 101 && g == 67 && b == 33) {   // Death by wall
                this.alive = false;
                Car.aliveAmount--;
            }

            // Fitness
            if (r == 2 && b == 20 && !this.visited[g]) {
                this.visited[g] = true;
                this.fitness ++;
            }

            let input = [this.sensorsRange[0], this.sensorsRange[1], this.sensorsRange[2], this.sensorsRange[3], this.xVel, this.yVel, this.angle, this.angularVel];
            this.output = this.brain.forwardPropagation(input);
            if (this.playerControlled) {
                if (keysPressed["w"]) {
                    this.xVel += Math.cos(this.angle) * Car.accSpeed;
                    this.yVel += Math.sin(this.angle) * Car.accSpeed;
                }
                if (keysPressed["s"]) {
                    this.xVel -= Math.cos(this.angle) * Car.accSpeed;
                    this.yVel -= Math.sin(this.angle) * Car.accSpeed;
                }
                if (keysPressed["a"]) {
                    this.angularVel -= Math.sqrt(Math.pow(this.xVel, 2) + Math.pow(this.yVel, 2)) / Car.turnSpeed;
                }
                if (keysPressed["d"]) {
                    this.angularVel += Math.sqrt(Math.pow(this.xVel, 2) + Math.pow(this.yVel, 2)) / Car.turnSpeed;
                }
            } else {
                if (this.output[0] > 0.5) {    // Accelerate
                    this.xVel += Math.cos(this.angle) * Car.accSpeed;
                    this.yVel += Math.sin(this.angle) * Car.accSpeed;
                }
                if (this.output[1] > 0.5) {   // Brake
                    this.xVel -= Math.cos(this.angle) * Car.accSpeed;
                    this.yVel -= Math.sin(this.angle) * Car.accSpeed;
                }
                if (this.output[2] > 0.5) {  // Rotate left
                    this.angularVel -= Math.sqrt(Math.pow(this.xVel, 2) + Math.pow(this.yVel, 2)) / Car.turnSpeed;
                }
                if (this.output[3] > 0.5) {  // Rotate right
                    this.angularVel += Math.sqrt(Math.pow(this.xVel, 2) + Math.pow(this.yVel, 2)) / Car.turnSpeed;
                }
            }
        }
    }

    getSensorDistances(barriersMap) {
        let distances = [];
        for (let i = 0; i < Car.sensors.length; i++) {
            distances.push(Car.sensorsMaxDist)
            for (let j = 0; j < Car.sensorsMaxDist; j += Car.sensorsAccuracy) {
                // Get each stage x and y.
                let x = Math.floor(this.x + Math.cos(this.angle + Car.sensors[i]) * j);
                let y = Math.floor(this.y + Math.sin(this.angle + Car.sensors[i]) * j);
                let index = (y * 960 + x) * 4;

                // Get RGB for x, y.
                let data = barriersMap.data;
                let r = data[index], 
                    g = data[index + 1],
                    b = data[index + 2],
                    t = data[index + 3];
                if (r == 101 && g == 67 && b == 33) {
                    distances[i] = j;
                    break;
                }
            }
        }
        return distances;
    }

    draw(ctx) {
        this.drawCar(ctx);
        if (this.alive) {
            this.drawSensors(ctx);
        }
    }

    drawCar(ctx) {
        ctx.translate(this.x, this.y);

        ctx.rotate(this.angle);
        if (this.alive) {
            ctx.fillStyle = "rgb(50, 200, 50, 255)";
        } else {
            ctx.fillStyle = "rgb(100, 100, 100, 255)";
        }
        ctx.strokeStyle = "#000000";
        ctx.fillRect(-Car.w/2, -Car.h/2, Car.w, Car.h);
        ctx.strokeRect(-Car.w/2, -Car.h/2, Car.w, Car.h);
        
        if (Car.DEBUGCHECK) {
            // Brakes
            if (this.output[1] > 0.5) {
                ctx.fillStyle = "rgb(255, 0, 0, 255)";
            } else {
                ctx.fillStyle = "rgb(0, 0, 0, 255)";
            }
            ctx.fillRect(-Car.w/2, -Car.h/2, 5, 5);
            ctx.fillRect(-Car.w/2, Car.h/2-5, 5, 5);

            // Rotations
            // Rotate left
            if (this.output[2] > 0.5) {
                ctx.fillStyle = "rgb(255, 255, 0, 255)";
            } else {
                ctx.fillStyle = "rgb(0, 0, 0, 255)";
            }
            ctx.fillRect(Car.w/2-5, -Car.h/2, 5, 5);

            // Rotate right
            if (this.output[3] > 0.5) {
                ctx.fillStyle = "rgb(255, 255, 0, 255)";
            } else {
                ctx.fillStyle = "rgb(0, 0, 0, 255)";
            }
            ctx.fillRect(Car.w/2-5, Car.h/2-5, 5, 5);
        }
        
        ctx.translate(-this.x, -this.y);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    drawSensors(ctx) {
        ctx.lineWidth = 1;

        for (let i = 0; i < Car.sensors.length; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(this.angle + Car.sensors[i]) * this.sensorsRange[i], this.y + Math.sin(this.angle + Car.sensors[i]) * this.sensorsRange[i]);
            ctx.stroke()
            ctx.closePath();
        }
    }

    reset() {
        this.x = 0;
        this.y = 250;
        this.xVel = 0
        this.yVel = 0
        this.angularVel = 0;
        this.angle = rad(0)
        this.alive = true;
        this.fitness = 0;
        this.visited = [];        
    }
    
    mutate() {
        let car = new Car(this.x, this.y, this.angle);
        car.brain = this.brain.mutate();

        return car
    }
}