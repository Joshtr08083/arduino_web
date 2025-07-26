import { useState } from "react";
import { useEffect } from "react";

import './App.css';
import Plant from "./components/Plant";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function App() {
	const [leafStates, setLeafStates] = useState({
		Leaf1: 0,
		Leaf2: 0,
		Leaf3: 0,
		Leaf4: 0
	})

	const [data, setData] = useState([
		{
			touchId: "touch1",
			value: 965,
		},
		{
			touchId: "touch2",
			value: 1020,
		},
		{
			touchId: "touch3",
			value: 920,
		},
		{
			touchId: "touch4",
			value: 890,
		},
	]);

	let dataBuffer = [
		[0],[0],[0],[0]
	]
	let dataAverages = [0,0,0,0]
	let diffPercents = [0,0,0,0]

	// Websocket Setup
	const WS_URL = "ws://127.0.0.1:8080";

	useEffect(() => {
		const socket = new WebSocket(WS_URL);

		socket.addEventListener("open", () => {
			socket.send('{"id":"a","auth":"a"}');
		});
		socket.addEventListener("message", async (event) => {
			if (event.data && event.data.text) {
				const dataText = await event.data.text();

				if (dataText == "no esp :(") {
					return;
				}

				const dataJSON = JSON.parse(dataText);

				for (let i = 1; i <= 4; i++) {
					let newData = dataJSON[`touch${i}`];

					// Populate empty data
					if (dataBuffer[i-1].length < 15) {
						for (let j = 0; j < 15; j++) {
							dataBuffer[i-1][j] = newData;
						}

						dataAverages[i-1] = newData; 
					
					} else {
						// Calculate percent from average
						const diffPercent = Math.abs((newData - dataAverages[i-1])/((dataAverages[i-1] != 0)? dataAverages[i-1] : 1));
						diffPercents[i-1] = diffPercent;
						
						// recalculates average if diffpercent is low
						if (diffPercent < 1) {
							let count = 0;
	
							for (let j = 0; j < 14; j++) {
								dataBuffer[i-1][j] = dataBuffer[i-1][j+1];
								count += dataBuffer[i-1][j+1];
							}
							dataBuffer[i-1][14] = newData;
							count += newData;
							dataAverages[i-1] = count / 15;
							
						}
					}
					
				}
				// console.log("Data: " + dataJSON.touch1 + ", Avg: " + Math.round(dataAverages[0]*100)/100 + ", Diff: " + Math.round(100 * 2000 * diffPercents[0])/100 + "%");
				
				setLeafStates({
					Leaf1: diffPercents[0],
					Leaf2: diffPercents[1],
					Leaf3: diffPercents[2],
					Leaf4: diffPercents[3]
				})
				
				setData([
					{
						touchId: "touch1",
						value: dataJSON.touch1,
					},
					{
						touchId: "touch2",
						value: dataJSON.touch2,
					},
					{
						touchId: "touch3",
						value: dataJSON.touch3,
					},
					{
						touchId: "touch4",
						value: dataJSON.touch4,
					},
				]);
			}
		});
	}, []);

	return (
		<div className="App">

		
		<Canvas className="canvas1">
			<ambientLight intensity={0.5} />
			<directionalLight position={[0, 10, 0]} intensity={2} />
			<OrbitControls enableZoom={true} enablePan={false} target={[0, 1, 0]} maxDistance={3} />
			<Plant leafStates={leafStates}/>
		</Canvas>
		</div>
	);
}

export default App;
