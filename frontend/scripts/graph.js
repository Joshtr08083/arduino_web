// BIG class to hold EVERYTHING for graphs
import { global } from "./globals.js?v=2.6";
import { getTable } from "./api.js?v=2.6"

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
                // X axis interval marks 1-15
                labels: this.intervals,
                datasets: [{
                    backgroundColor:"rgba(29, 27, 38, 0.44)",
                    borderColor: "rgba(29, 27, 38, 0.37)",
                    // Point values
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
                        // Y axis label
                        labelString: yLabel
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        // X axis label
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
            // Pushes new data if unpaused
            if (!this.paused) {
                
                this.values.push(global.data[this.DOMname]);
                this.values.shift();
                this.chart.data.datasets[0].data = this.values;
                this.chart.update();
            }
            // Incremenets x-interval counter if paused
            // It has drawbacks, but overall i like the increased accuracy of maintaining time even during pause
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
        
        if (this.paused) { // Updates DOM elements to display pause, also enabling the timeline buttons
            document.getElementById(`${this.DOMname}ButtonText`).innerHTML = "▷";
            document.getElementById(`${this.DOMname}TimeLeft`).classList.remove('hide');
            document.getElementById(`${this.DOMname}Drop`).disabled = true;
    
        } else {
            document.getElementById(`${this.DOMname}Drop`).disabled = false;
            document.getElementById(`${this.DOMname}ButtonText`).innerHTML = "||";
            document.querySelectorAll(`.${this.DOMname}Time`).forEach((element) => {element.classList.add('hide')});

            // Resets time position to 0 (current)
            this.timePos = 0;

            // Fetches current data from server and resets x intervals
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
        // Clears current update interval
        clearInterval(this.updateInterval);
        // Changes graph mode, and fetches data from server to match that table
        this.graphMode = mode;
        await this.getData();
        this.chart.data.datasets[0].data = this.values;
        this.chart.update();
        // Sets new interval based on mode
        this.updateInterval = setInterval(async () => this.updateGraph(), (mode === "Seconds") ? 1000 : (mode === "Minutes") ? 60000 : (mode === "Hours") ? 3600000 : 1000);
    }
    // Controls chaning time frame
    async timeline(direction) {
        if (direction == 'left') {
            document.getElementById(`${this.DOMname}TimeRight`).classList.remove('hide');
            // Shiftts time frame backwards (incrementing time pos, counterintuitive, but it works)
            this.timePos += 1;
            // Increments x intervals by 15 to adjust for the shift
            this.intervals.forEach((val, i) => {this.intervals[i] = val+15});
            this.chart.data.labels = this.intervals;
            // Fetches new data and updates graph
            await this.getData();
            this.chart.data.datasets[0].data = this.values;
            this.chart.update();
    
    
        } else if (direction == 'right') {
            if (this.timePos > 0) {
                // Disables going forward in time past the moment it was paused
                if (this.timePos == 1) document.getElementById(`${this.DOMname}TimeRight`).classList.add('hide');
                // Decrements time pos, going forward in time
                this.timePos -= 1;
                // Decrements x interval by 15
                this.intervals.forEach((val, i) => {this.intervals[i] = val-15});
                this.chart.data.labels = this.intervals;
                // Fetches new data and updates graph
                await this.getData();
                this.chart.data.datasets[0].data = this.values;
                this.chart.update();
            }
        }
    }

    // Fetches data from server for when the graph is unpaused or timeline is used
    async getData() {
        console.log("GET request from graph " + this.DOMname + " to table " + this.graphMode);
        for (let i = 0; i < 5; i++) {
            // api request
            const dataArray = await getTable(this.graphMode.toLowerCase(), this.timePos);
            // Retries or quits if getTable returns null (meaning error or no response)
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

            // Iterates through data array and updates this.values and updates graph
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