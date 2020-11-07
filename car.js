var key;

class Car {
    static aliveAmount;
    static w = 50;
    static h = 25;
    static sensorsMaxDist = 500;
    static sensors = [-0.4, -1, 0.4, 1];
    static sensorsAccuracy = 1; // The larger the less precise
    static velMax = 10;

    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle

        this.vel = 0;
        this.acc = 0;
        this.alive = true;
        this.fitness = 0;
        this.visited = [];

        this.sensorsRange = [0, 0, 0, 0, 0, 0];

        // MLP:
        // Input is sensors range and speed.
        // Output is turn left, turn right, speed up or brake.
        this.brain = new MLP(5, 5, 4);

        this.playerControlled = false;
    }

    tick(keysPressed, barriersMap, time, timeout) {
        if (this.alive) {
            this.sensorsRange = this.getSensorDistances(barriersMap);
            this.x += Math.cos(this.angle) * this.vel;
            this.y += Math.sin(this.angle) * this.vel;
            
            let i = (Math.floor(this.y) * 960 + Math.floor(this.x)) * 4;
            let data = barriersMap.data;
            
            let r = data[i], 
                g = data[i + 1],
                b = data[i + 2],
                t = data[i + 3];
            // Death
            
            if ((this.x < 0 || this.x > 960) || (this.y < 0 || this.y > 960)) { // Death by restriction
                this.alive = false;
                Car.aliveAmount--;
                this.fitness += (1 - (time / timeout)) * this.fitness;
            } 
            else if (r == 101 && g == 67 && b == 33) {   // Death by wall
                this.alive = false;
                Car.aliveAmount--;
            }

            // Fitness
            if (r == 2 && b == 2) {
                if (!this.visited[g]) {
                    this.visited[g] = true;
                    this.fitness ++;
                }
            }

            if (this.playerControlled) {
                if (keysPressed["w"]) {
                    this.acc = Math.min(this.acc + 0.025, 2);
                }
                if (keysPressed["s"]) {
                    this.acc = Math.max(this.acc - 0.05, 0);
                }
                if (keysPressed["a"]) {
                    this.angle -= 0.5;  // this.vel  / 25
                }
                if (keysPressed["d"]) {
                    this.angle += 0.5;
                }
            } else {
                let input = [this.sensorsRange[0], this.sensorsRange[1], this.sensorsRange[2], this.sensorsRange[3], this.vel];
                let output = this.brain.forwardPropagation(input);

                if (output[0] > 0.5) {    // Rotate left
                    this.angle -= this.vel / 50; //this.vel / 65
                }
                if (output[1] > 0.5) {   // Rotate right
                    this.angle += this.vel / 50;
                }
                if (output[2] > 0.5) {  // Speed up
                    this.vel = Math.min(this.vel + 0.05, Car.velMax);
                }
                if (output[3] > 0.5) {  // Brake
                    this.vel = Math.max(this.vel - 0.1, 0);
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
        this.vel = 0;
        this.acc = 0;
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