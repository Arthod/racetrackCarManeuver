class MLP {
    static mutationRate = 0.1;
    constructor(inputNeuronsAmount, hiddenNeuronsAmount, outputNeuronsAmount) {
        this.inputNeuronsAmount = inputNeuronsAmount;
        this.hiddenNeuronsAmount = hiddenNeuronsAmount;
        this.outputNeuronsAmount = outputNeuronsAmount;

        this.weights = [];
        this.biases = [];

        this.layer0 = [0,0,0,0,0,0,0,0]
        this.layer1 = [0,0,0,0,0,0]
        this.layer2 = [0,0,0,0]
    }

    forwardPropagation(input) {
        this.layer0 = input;
        
        // LAYER 1
        this.layer1 = [];
        for (let i = 0; i < this.hiddenNeuronsAmount; i++) {
            let sum = 0;
            for (let j = 0; j < this.inputNeuronsAmount; j++) {
                sum += this.weights[0][i][j] * this.layer0[j] + this.biases[0][i];
            }
            this.layer1.push(this.activation(sum));
        }
        // LAYER 2
        this.layer2 = [];
        for (let i = 0; i < this.outputNeuronsAmount; i++) {
            let sum = 0;
            for (let j = 0; j < this.hiddenNeuronsAmount; j++) {
                sum += this.weights[1][i][j] * this.layer1[j] + this.biases[1][i];
            }
            this.layer2.push(this.activation(sum));
        }
        return this.layer2;
    }

    generateWeightsAndBiases() {
        // Weights
        let w = [];
        for (let i = 0; i < this.hiddenNeuronsAmount; i++) {
            w.push([]);
            for (let j = 0; j < this.inputNeuronsAmount; j++) {
                w[i].push(Math.random() - 0.5);
            }
        }
        this.weights.push(w);
        w = [];
        for (let i = 0; i < this.outputNeuronsAmount; i++) {
            w.push([]);
            for (let j = 0; j < this.hiddenNeuronsAmount; j++) {
                w[i].push(Math.random() - 0.5);
            }
        }
        this.weights.push(w);

        // Biases
        let b = [];
        for (let i = 0; i < this.hiddenNeuronsAmount; i++) {
            b.push(Math.random() - 0.5);
        }
        this.biases.push(b);
        b = [];
        for (let i = 0; i < this.outputNeuronsAmount; i++) {
            b.push(Math.random() - 0.5);
        }
        this.biases.push(b);
    }

    activation(n) {
        return 1 / (1 + Math.exp(-n));
    }

    mutate() {
        let new_weights = [];
        let w = []
        for (let i = 0; i < this.hiddenNeuronsAmount; i++) {
            w.push([]);
            for (let j = 0; j < this.inputNeuronsAmount; j++) {
                w[i].push(this.weights[0][i][j] + (Math.random() - 0.5) * MLP.mutationRate);
            }
        }
        new_weights.push(w);
        w = [];
        for (let i = 0; i < this.outputNeuronsAmount; i++) {
            w.push([]);
            for (let j = 0; j < this.hiddenNeuronsAmount; j++) {
                w[i].push(this.weights[1][i][j] + (Math.random() - 0.5) * MLP.mutationRate);
            }
        }
        new_weights.push(w);

        let new_biases = [];
        let b = [];
        for (let i = 0; i < this.hiddenNeuronsAmount; i++) {
            b.push(this.biases[0][i] + (Math.random() - 0.5) * MLP.mutationRate);
        }
        new_biases.push(b);
        b = [];
        for (let i = 0; i < this.outputNeuronsAmount; i++) {
            b.push(this.biases[1][i] + (Math.random() - 0.5) * MLP.mutationRate);
        }
        new_biases.push(b);

        let new_brain = new MLP(this.inputNeuronsAmount, this.hiddenNeuronsAmount, this.outputNeuronsAmount);
        new_brain.weights = new_weights;
        new_brain.biases = new_biases;

        return new_brain;
    }
}