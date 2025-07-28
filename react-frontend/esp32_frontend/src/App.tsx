import { useState } from "react";
import { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.css";
import "./App.css";

// plant
import Plant from "./components/Plant";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import DataList from "./components/DataList";
import AlertModal from "./components/AlertModal";

function App() {
	const [leafStates, setLeafStates] = useState({
		Leaf1: 0,
		Leaf2: 0,
		Leaf3: 0,
		Leaf4: 0,
	});

	const [data, setData] = useState([
		{ reading: -1, avg: -1 },
		{ reading: -1, avg: -1 },
		{ reading: -1, avg: -1 },
		{ reading: -1, avg: -1 },
	]);

	const [showAlertModal, setShowAlertModal] = useState(false);
	const [modalContent, setModalContent] = useState({ title: "", content: "" });

	let dataBuffer = [
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
	];
	let dataAverages = [0, 0, 0, 0];
	let diffPercents = [0, 0, 0, 0];

	// Websocket Setup
	const WS_URL = "ws://127.0.0.1:8080";

	useEffect(() => {
		const socket = new WebSocket(WS_URL);

		socket.addEventListener("open", () => {
			socket.send('{"id":"a","auth":"a"}');
		});
		socket.addEventListener("close", () => {
			setModalContent({
				title: "Server Disconnected",
				content:
					"Lost connection to server. Ensure server is running and reload.",
			});
			setShowAlertModal(true);
		});
		socket.addEventListener("message", async (event) => {
			
			if (event.data) {
				if (event.data.text) {
					
					if (showAlertModal) {
						setShowAlertModal(false);
					}

					const dataText = await event.data.text();
					const dataJSON = JSON.parse(dataText);

					for (let i = 0; i < 4; i++) {
						let newData = dataJSON[`touch${i + 1}`];

						// Populate empty data
						if (dataBuffer[i][0] === -1) {
							dataBuffer[i].fill(newData);
							dataAverages[i] = newData;
						} else {
							// Calculate percent from average
							const diffPercent = Math.abs(
								(newData - dataAverages[i]) /
									(dataAverages[i] != 0 ? dataAverages[i] : 1)
							);
							diffPercents[i] = diffPercent;

							// recalculates average if diffpercent is low
							if (diffPercent < 1) {
								dataBuffer[i].shift();
								dataBuffer[i].push(newData);
								const count = dataBuffer[i].reduce(
									(total, val) => total + val,
									0
								);

								dataAverages[i] = count / 15;
							}
						}
					}

					setLeafStates({
						Leaf1: diffPercents[0],
						Leaf2: diffPercents[1],
						Leaf3: diffPercents[2],
						Leaf4: diffPercents[3],
					});

					setData([
						{ reading: dataJSON.touch1, avg: Math.round(dataAverages[0]) },
						{ reading: dataJSON.touch2, avg: Math.round(dataAverages[1]) },
						{ reading: dataJSON.touch3, avg: Math.round(dataAverages[2]) },
						{ reading: dataJSON.touch4, avg: Math.round(dataAverages[3]) },
					]);


				} else if (event.data === "no esp :(") {

					if (!showAlertModal) {
						setModalContent({
							title: "ESP32 Unavailable",
							content:
								"ESP32 is not responding. Check if esp32 is turned on and connected. If alert doesn't hide, but data is updating, try reloading.",
						});
						setShowAlertModal(true);
					}
					
				}
				
			}
		});
	}, []);

	return (
		<>
			<div className="App bg-dark text-white">
				<h2 className="text-white border-secondary text-center border-bottom w-50 m-auto p-3">
					PLANT VIEWER
				</h2>

				<DataList data={data} />

				<div className="m-auto w-50 h-100 fixed-top position-absolute">
					<Canvas className="cursor-move">
						<ambientLight intensity={0.5} />
						<directionalLight position={[0, 10, 0]} intensity={2} />
						<OrbitControls
							enableZoom={false}
							enablePan={false}
							target={[0, 1, 0]}
							maxDistance={2.5}
						/>
						<Plant leafStates={leafStates} />
					</Canvas>
				</div>
				<AlertModal title={modalContent.title} show={showAlertModal}>
					{modalContent.content}
				</AlertModal>
			</div>
		</>
	);
}

export default App;
