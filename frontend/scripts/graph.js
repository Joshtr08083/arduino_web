// BIG class to hold EVERYTHING for graphs
import { global } from "./main.js";
import { getTable } from "./api.js"

export class Graph {
    constructor(DOMname, xLabel, yLabel, title, range, values = []) {
        // X and y axis labels
        this.xLabel = xLabel;
        this.yLabel = yLabel;
        // X axis intervals
        this.intervals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        // Point values
        this.values = values;
        // Graph interval mode, defaults to seconds
        this.graphMode = 'Seconds';
        // Time frame, 0 is current, anything greater is x * 15 (units depending on mode) behind.
        this.timePos = 0;
        // Tracks pause condition
        this.paused = false;
        // DOMname is critical here, everything in relation to the graph should be named as:
        // DOMname + consistent name
        // For example, for DOMname apple, it should be data.apple, or appleButton, appleSeconds, etc.
        // !! IMPORANT: DOMname MUST match data received from websocket
        // names can be: temp, humid, press, light, and dist
        this.DOMname = DOMname;

        // Creates chart using chart.js
        this.chart = new Chart(`${DOMname}Chart`, {
            type: "line",
            data: {
                labels: this.intervals,
                datasets: [{
                    backgroundColor:"rgba(29, 27, 38, 0.44)",
                    borderColor: "rgba(29, 27, 38, 0.37)",
                    data: this.values,
                    lineTension: 0.1
                }]
            },
            options: {
                legend: {display: false},
                title: {
                    display: true,
                    text: title
                },
                scales: {
                yAxes: [{
                    ticks: {min: range.low, max: range.high},
                    scaleLabel: {
                        display: true,
                        labelString: yLabel
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: xLabel
                    }
                }]
                }
            }
        });

        // Creates initial update interval, updating graph every second
        this.updateInterval = setInterval(async () => this.updateGraph(), 1000);

        // event listeners
        document.getElementById(`${DOMname}Button`).addEventListener('click', async () => this.pause() );
        document.getElementById(`${DOMname}Seconds`).addEventListener('click', async () => this.changeInterval('Seconds') );
        document.getElementById(`${DOMname}Minutes`).addEventListener('click', async () => this.changeInterval("Minutes") );
        document.getElementById(`${DOMname}Hours`).addEventListener('click',   async () => this.changeInterval("Hours") );
        document.getElementById(`${DOMname}TimeLeft`).addEventListener('click', async () => this.timeline('left') );
        document.getElementById(`${DOMname}TimeRight`).addEventListener('click', async () => this.timeline('right') );
    }

    // Function to update the graph, called using setInterval(s)
    async updateGraph() {
        if (global.data) {
            if (!this.paused) {
                
                this.values.push(global.data[this.DOMname]);
                this.values.shift();
                this.chart.data.datasets[0].data = this.values;
                this.chart.update();
            }
            else {
                this.intervals.forEach((val, i) => {this.intervals[i] = val+1});
                this.chart.data.labels = this.intervals;
                this.chart.update();
            }
        }
    }

    // Controls pause state
    async pause() {
        this.paused = !this.paused;
        if (this.paused) {
            document.getElementById(`${this.DOMname}ButtonText`).innerHTML = "▷";
            document.getElementById(`${this.DOMname}TimeLeft`).classList.remove('hide');
            document.getElementById(`${this.DOMname}Drop`).disabled = true;
    
        } else {
            document.getElementById(`${this.DOMname}Drop`).disabled = false;
            document.getElementById(`${this.DOMname}ButtonText`).innerHTML = "||";
            document.querySelectorAll(`.${this.DOMname}Time`).forEach((element) => {element.classList.add('hide')});
            this.timePos = 0;
            await this.getData();
            this.chart.data.datasets[0].data = this.values;
            this.intervals = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
            this.chart.data.labels = this.intervals;
            this.chart.update();
        }
    }
    // Changes intervals between seconds, minutes, hours
    async changeInterval(mode) {
        document.getElementById(`${this.DOMname}Drop`).innerHTML = mode;
        clearInterval(this.updateInterval);
        this.graphMode = mode;
        await this.getData();
        this.chart.data.datasets[0].data = this.values;
        this.chart.update();
        this.updateInterval = setInterval(async () => this.updateGraph(), (mode === "Seconds") ? 1000 : (mode === "Minutes") ? 60000 : (mode === "Hours") ? 3600000 : 1000);
    }
    // Controls chaning time frame
    async timeline(direction) {
        if (direction == 'left') {
            document.getElementById(`${this.DOMname}TimeRight`).classList.remove('hide');
            this.timePos += 1;
            this.intervals.forEach((val, i) => {this.intervals[i] = val+15});
            this.chart.data.labels = this.intervals;
            await this.getData();
            this.chart.data.datasets[0].data = this.values;
            this.chart.update();
    
    
        } else if (direction == 'right') {
            if (this.timePos > 0) {
                if (this.timePos == 1) document.getElementById(`${this.DOMname}TimeRight`).classList.add('hide');
                this.timePos -= 1;
                this.intervals.forEach((val, i) => {this.intervals[i] = val-15});
                this.chart.data.labels = this.intervals;
                await this.getData();
                this.chart.data.datasets[0].data = this.values;
                this.chart.update();
            }
        }
    }

    // Fetches data from server for when the graph is unpaused or timeline is used
    async getData() {
        console.log("GET request to " + this.DOMname + " from " + this.graphMode);
        for (let i = 0; i < 5; i++) {
            const dataArray = await getTable(this.graphMode.toLowerCase(), this.timePos);
            if (dataArray === null) {
                if (i == 4) {
                    console.log("Server not responding");
                    if (global.connectionState.server) {
                        global.connectionState.server = false;
                        connectionError();
                        reconnect();
                    }
                    break;
                }
                console.log("Failed request, retrying... Attempt:" + (i+1));
                continue;
            } 

            const dataLength = dataArray.length;
            this.values = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
            if (dataLength != 0) {
                for (let i = 0; i < dataArray.length; i++) {
                    this.values[i + (15-dataLength)] = dataArray[i].data[this.DOMname]
                }
            }
            break;

        }

    }
}