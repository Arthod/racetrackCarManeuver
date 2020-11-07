var cars, leftTrackPoints, rightTrackPoints, trackWidth, trackPoints;
var keysPressed = [];
leftTrackPoints = [];
rightTrackPoints = [];

trackWidth = 45;
trackPoints = [[0, 250], [150, 246], [184, 228], [186, 202], [198, 169], [220, 131], [256, 110], [300, 98], [326, 104], [357, 148], [366, 177], [370, 223], [365, 263], [363, 304], [379, 331], [402, 346], [443, 348], [480, 347], [504, 347], [631, 347], [729, 352], [850, 357], [884, 395], [882, 451], [882, 497], [853, 532], [804, 533], [788, 505], [742, 481], [696, 496], [683, 577], [682, 636], [735, 665], [811, 667], [881, 687], [875, 747], [808, 816], [677, 831], [561, 822], [504, 810], [447, 749], [468, 695], [524, 596], [489, 485], [330, 494], [279, 547], [252, 609], [232, 656], [153, 696], [50, 696], [0, 695]];
generateTrackPointsBorders();

function startGame() {
    cars = [];
    for (let i = 0; i < 100; i++) {
        let car = new Car(0, 250, rad(0))
        car.brain.generateWeightsAndBiases()
        cars.push(car);
    }
    Car.aliveAmount = cars.length;
    myGameArea.start();
}

var myGameArea = {
    start : function() {
        this.canvas = document.getElementById("gameCanvas");
        this.canvas.width = 960;
        this.canvas.height = 900;
        this.context = this.canvas.getContext("2d");
        this.gameTickInterval = setInterval(tick, 1000/60);
        this.HTMLFastUpdateInterval = setInterval(HTMLFastUpdateInterval, 50);
        this.HTMLUpdateInterval = setInterval(HTMLUpdateInterval, 500);
        this.context.font = "16px Arial";

        // Network
        this.networkCanvas = document.getElementById("gameNetworkCanvas")
        this.networkCanvas.width = 800;
        this.networkCanvas.height = 300;
        this.networkContext = this.networkCanvas.getContext("2d");
        this.networkContext.font = "12px Arial";
        this.networkCanvasOutputTexts = ["Rotate Left", "Rotate Right", "Accelerate", "Brake"]
        this.networkCanvasInputTexts = ["Sensor leftmost", "Sensor left", "Sensor right", "Sensor rightmost", "Velocity"]

        // Draw the map (without cars)
        drawLines(this.context, trackPoints);
        drawPolygon(this.context, leftTrackPoints, "rgb(101,67,33)");
        drawPolygon(this.context, rightTrackPoints, "rgb(101,67,33)");
        this.barriersMap = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

        this.timeTimeout = 1200;
        this.time = 0;
        this.mouseClickTimer = 0;
        this.generationNumber = 0;
        this.drawingCustomMap = false;
        this.populationKillPercentage = 0.80;
        this.populationMax = 100;
    },
    
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.networkContext.clearRect(0, 0, this.networkCanvas.width, this.networkCanvas.height);
    }
}

function tick() {
    myGameArea.clear();
    drawCarNetwork();

    if (myGameArea.drawingCustomMap) {
        myGameArea.mouseClickTimer += 1

        drawPolygon(myGameArea.context, leftTrackPoints, "rgb(101, 67, 33, 100)");
        drawPolygon(myGameArea.context, rightTrackPoints, "rgb(101, 67, 33, 100)");
        drawLines(myGameArea.context, trackPoints)

        myGameArea.canvas.addEventListener('click', event => {
            if (myGameArea.mouseClickTimer > 30) {
                let bound = myGameArea.canvas.getBoundingClientRect();
            
                let x = event.clientX - bound.left - myGameArea.canvas.clientLeft;
                let y = event.clientY - bound.top - myGameArea.canvas.clientTop;
                trackPoints.push([x, y])
                generateTrackPointsBorders();

                myGameArea.mouseClickTimer = 0;
            }
        });

    } else {
        gameTick();
    }
}

function drawCarNetwork() {
    let ctx = myGameArea.networkContext;
    let car = cars[0];

    let circleRadius = 15
    let x0 = 140;
    let x1 = 400;
    let x2 = 660;

    for (let i = 0; i < car.brain.inputNeuronsAmount; i++) {
        let yPos = 60 * i + 20;
        ctx.beginPath();
        ctx.arc(x0, yPos, circleRadius, 0, 2 * Math.PI);
        ctx.fillText(myGameArea.networkCanvasInputTexts[i], x0 - 120, yPos);
        ctx.stroke();
    }

    for (let i = 0; i < car.brain.hiddenNeuronsAmount; i++) {
        let yPos = 60 * i + 20;
        for (let j = 0; j < car.brain.inputNeuronsAmount; j++) {
            ctx.beginPath();
            ctx.moveTo(x0, 60 * j + 20);
            ctx.lineTo(x1, yPos);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(x1, yPos, circleRadius, 0, 2 * Math.PI);
        let gray = car.brain.layer1[i] * 255;
        ctx.fillStyle = 'rgb(' + gray + ', ' + gray + ', ' + gray + ', 255)';
        ctx.fill();
        ctx.stroke();
    }

    for (let i = 0; i < car.brain.outputNeuronsAmount; i++) {
        let yPos = 60 * i + 50;
        for (let j = 0; j < car.brain.hiddenNeuronsAmount; j++) {
            if (car.brain.weights[1][i][j] > -100) {
                ctx.beginPath();
                ctx.moveTo(x1, 60 * j + 20);
                ctx.lineTo(x2, yPos);
                ctx.stroke();
            }
        }
        ctx.beginPath();
        ctx.arc(x2, yPos, circleRadius, 0, 2 * Math.PI);
        let gray = Math.round(car.brain.layer2[i]) * 255;
        ctx.fillStyle = 'rgb(0, ' + gray + ', 0, 255)';
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillText(myGameArea.networkCanvasOutputTexts[i], x2 + 30, yPos);
        ctx.stroke();
    }
}

function gameTick() {
    // key events
    document.body.addEventListener("keydown", function (e) {
        keysPressed[e.key] = true;
    });
    document.body.addEventListener("keyup", function (e) {
        keysPressed[e.key] = false;
    });
    myGameArea.time++;

    for (let i = 0; i < cars.length; i++) {
        cars[i].tick(keysPressed, myGameArea.barriersMap, myGameArea.time, myGameArea.timeTimeout);
    }

    if (Car.aliveAmount == 0) {
        generation();
    } else if (myGameArea.time > myGameArea.timeTimeout) {
        generation();
    }

    let ctx = myGameArea.context;

    draw(ctx);
}

function generation() {
    myGameArea.time = 0;
    Car.aliveAmount = myGameArea.populationMax;

    // Sort cars by their fitness.
    cars.sort(function(carA, carB) {
        return carB.fitness - carA.fitness;
    });
    HTMLUpdateGeneration();

    if (cars.length != 1) {
        // Kill bottom killPopulationPercentage%
        let popsToKill = Math.floor(myGameArea.populationKillPercentage * myGameArea.populationMax)
        for (let i = 0; i < popsToKill; i++) {
            cars.splice(Car.aliveAmount - popsToKill);
        }

        // Bring back cars
        let new_cars = [];
        let carsLeft = cars.length;
        for (let i = 0; i < cars.length; i++) {
            // Reset all cars
            cars[i].reset();

            // Mutate cars back
            for (let j = 0; j < Math.floor(popsToKill / carsLeft); j++) {
                new_cars.push(cars[i].mutate())
            }
        }
        cars = cars.concat(new_cars);
    } else {
        cars[0].reset();
    }

    myGameArea.generationNumber++;
}

function killAllButBest() {
    cars.sort(function(carA, carB) {
        return carB.fitness - carA.fitness;
    });
    savedCar = cars[0];
    cars = [savedCar]
}

function draw(ctx) {
    ctx.beginPath();

    drawPolygon(ctx, leftTrackPoints, "rgb(101,67,33)");
    drawPolygon(ctx, rightTrackPoints, "rgb(101,67,33)");
    for (let i = 0; i < cars.length; i++) {
        cars[i].draw(ctx);
    }

    ctx.fillStyle = "#000000";
}

function rad(deg) {
    return deg * Math.PI / 180;
}

function drawLines(ctx, points) {
    ctx.lineWidth = trackWidth * 1.4;
    for (let i = 1; i < points.length; i++) {
        ctx.beginPath();
        ctx.strokeStyle = "rgb(2, " + Math.floor(255 * (i / points.length)) + ", 2, 255)";
        ctx.moveTo(points[i - 1][0], points[i - 1][1])
        ctx.lineTo(points[i][0], points[i][1]);
        ctx.stroke()
        
        ctx.closePath();
    }
    ctx.lineWidth = 1;
    ctx.StrokeStyle = "#000000";
}

function drawPolygon(ctx, points, color) {
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

function HTMLFastUpdateInterval() {
    $('#gameInfoTimeout').width(100 - (myGameArea.time / myGameArea.timeTimeout) * 100 + "%")
}

function HTMLUpdateInterval() {
    // Update population alive/dead chart
    populationChart.data.labels.push(myGameArea.time);
    populationChart.data.datasets[0].data.push(Car.aliveAmount);
    populationChart.update();
}

function HTMLUpdateGeneration() {
    fitnessChart.data.labels.push(myGameArea.generationNumber);
    fitnessChart.data.datasets[1].data.push(cars[0].fitness);
    let avg = 0;
    for (let i = 0; i < cars.length; i ++) { avg += cars[i].fitness; }
    avg = avg / cars.length;
    fitnessChart.data.datasets[0].data.push(avg);
    fitnessChart.update();

    $('#gameInfoGeneration').html(myGameArea.generationNumber);
    $('#gameInfoBestFitness').html(cars[0].fitness);
    $('#gameInfoAverageFitness').html(avg);

    // Wipe population chart
    populationChart.data.labels = [];
    populationChart.data.datasets[0].data = [];
}

function HTMLbuttons(id, subId) {
    // Reset population
    if (id == 0) {
        clearInterval(myGameArea.gameTickInterval);
        clearInterval(myGameArea.HTMLUpdateInterval);
        clearInterval(myGameArea.HTMLFastUpdateInterval);
        startGame();
        fitnessChart.data.labels = [];
        fitnessChart.data.datasets[1].data = [];
        fitnessChart.data.datasets[0].data = [];
        fitnessChart.update();

        HTMLUpdateGeneration();
    }
    // Force next generation
    if (id == 1) {
        generation();
    }
    // Custom map stuff
    if (id == 2) {
        // Start draw custom map
        if (subId == 0) {
            myGameArea.drawingCustomMap = true;
            leftTrackPoints = [];
            rightTrackPoints = [];
            trackPoints = [[0, 250]];
            myGameArea.clear();
            generateTrackPointsBorders();
        }
        // Finish draw custom map
        if (subId == 1) {
            myGameArea.barriersMap = myGameArea.context.getImageData(0, 0, myGameArea.canvas.width, myGameArea.canvas.height);
            //startGame();
            //HTMLbuttons(0);
            clearInterval(myGameArea.gameTickInterval);
            clearInterval(myGameArea.HTMLUpdateInterval);
            clearInterval(myGameArea.HTMLFastUpdateInterval);
            myGameArea.start();
            
            // Reset all cars
            for (let i = 0; i < cars.length; i++) {
                cars[i].reset();
            }
            HTMLbuttons(3);
        }
        // Use default map
        if (subId == 2) {
            trackPoints = [[0, 250], [150, 246], [184, 228], [186, 202], [198, 169], [220, 131], [256, 110], [300, 98], [326, 104], [357, 148], [366, 177], [370, 223], [365, 263], [363, 304], [379, 331], [402, 346], [443, 348], [480, 347], [504, 347], [631, 347], [729, 352], [850, 357], [884, 395], [882, 451], [882, 497], [853, 532], [804, 533], [788, 505], [742, 481], [696, 496], [683, 577], [682, 636], [735, 665], [811, 667], [881, 687], [875, 747], [808, 816], [677, 831], [561, 822], [504, 810], [447, 749], [468, 695], [524, 596], [489, 485], [330, 494], [279, 547], [252, 609], [232, 656], [153, 696], [50, 696], [0, 695]];
            generateTrackPointsBorders();
            clearInterval(myGameArea.gameTickInterval);
            clearInterval(myGameArea.HTMLUpdateInterval);
            clearInterval(myGameArea.HTMLFastUpdateInterval);
            myGameArea.start();

            // Reset all cars
            for (let i = 0; i < cars.length; i++) {
                cars[i].reset();
            }
        }
    }
    // Set settings
    if (id == 3) {
        let newMutationsRate = $('#gameSettingsMutationRate').val();
        let newPercentageToKill = $('#gameSettingsPercentageToKill').val();
        let newTicksTillTimeout = $('#gameSettingsTicksTillTimeout').val();
        let TicksPerSecond = $('#gameSettingsTicksPerSecond').val();
        
        MLP.mutationRate = newMutationsRate / 100;
        myGameArea.populationKillPercentage = newPercentageToKill / 100;
        myGameArea.timeTimeout = newTicksTillTimeout;
        clearInterval(myGameArea.gameTickInterval);
        myGameArea.gameTickInterval = setInterval(tick, 1000/TicksPerSecond);
    }
}

function generateTrackPointsBorders() {
    leftTrackPoints = [[0, 250 - trackWidth]];
    rightTrackPoints = [[0, 250 + trackWidth]];

    for (let i = 1; i < trackPoints.length; i++) {
        let vector0 = [trackPoints[i][0] - trackPoints[i - 1][0], trackPoints[i][1] - trackPoints[i - 1][1]];
        let normalVector0 = [-vector0[1], vector0[0]];
        let normalVector0Length = Math.sqrt(Math.pow(normalVector0[0], 2) + Math.pow(normalVector0[1], 2));
        normalVector0 = [(-trackWidth * normalVector0[0]) / normalVector0Length, (-trackWidth * normalVector0[1]) / normalVector0Length];
        
        leftTrackPoints.push([normalVector0[0] + trackPoints[i][0], normalVector0[1] + trackPoints[i][1]]);

        normalVector0 = [-vector0[1], vector0[0]];
        normalVector0 = [(trackWidth * normalVector0[0]) / normalVector0Length, (trackWidth * normalVector0[1]) / normalVector0Length];
        rightTrackPoints.push([normalVector0[0] + trackPoints[i][0], normalVector0[1] + trackPoints[i][1]]);
    }
    leftTrackPoints.push([0, 900], [960, 900], [960, 0], [0, 0])
}

function changeValueSlider(idFrom, idTo) {
    $('#' + idTo).val($('#' + idFrom).val());
}
function changeValueInput(idFrom, idTo) {
    let val = Number($('#' + idFrom).val());
    let toObj = $('#' + idTo);
    if (val > toObj.attr("max")) {
        $('#' + idFrom).val(toObj.attr("max"));
    } else if (val < toObj.attr("min")) {
        $('#' + idFrom).val(toObj.attr("min"));
    }
    $('#' + idTo).val($('#' + idFrom).val());
}