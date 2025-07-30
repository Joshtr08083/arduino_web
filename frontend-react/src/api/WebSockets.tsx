import { useEffect, useRef, useState, useReducer } from "react";

type Toast = { touchId: number; percentDiff: number; key: string };
type Action =
	| { type: "PUSH"; payload: Toast }
	| { type: "SHIFT" }
	| { type: "DELETE"; target: number };

function manageToasts(state: Toast[], action: Action): Toast[] {
	switch (action.type) {
		case "PUSH":
			if (state.some((toast) => toast.key === action.payload.key)) {
				console.log("Duplicate entry");
				return state;
			}

			if (state.length > 7) {
				const trimmed = state.length > 6 ? state.slice(-7) : state;
				return [...trimmed, action.payload];
			}
			return [...state, action.payload];
		case "SHIFT":
			return state.slice(1);
		case "DELETE":
			return state.filter((_, idx) => idx !== action.target);
		default:
			throw Error("Unknown action.");
	}
}

export function websocketController() {
	const [modalVisible, setModalVisibility] = useState(false);
	const [modalType, setModalType] = useState("");
	const [toasts, setToasts] = useReducer(manageToasts, [
		{ touchId: 0, percentDiff: 1, key: "" },
	]);
	const onToastClose = (id: number) => {
		setToasts({ type: "DELETE", target: id });
	};

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
	let dataBuffer = [
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
	];
	let dataAverages = [0, 0, 0, 0];
	let leafShadePercents = [0, 0, 0, 0];
	const TOUCH_THRESHOLD = {low: 0.0, mid: 0.02, high: 0.1};


	const touched = useRef([
		{ touched: false, releaseTime: 0 },
		{ touched: false, releaseTime: 0 },
		{ touched: false, releaseTime: 0 },
		{ touched: false, releaseTime: 0 },
	]);
	// dont know what to name this but its how long finger must be released for touched to change back to false
	const RELEASE_DEBOUNCE = 100;

	// const WS_URL = `${window.location.origin}/ws/`;
	const WS_URL = 'ws://127.0.0.1:8080'
	const socketCloseIntentional = useRef(false);
	const lastReconnect = useRef(0);
	const [reconnect, setReconnect] = useState(0);
	const RECONNECT_DELAY = 1000;
	const onReconnect = () => {
		const now = Date.now();
		if (now > lastReconnect.current + RECONNECT_DELAY) {
			lastReconnect.current = now;
			setReconnect(reconnect + 1);
		}
	};

	useEffect(() => {
		setToasts({ type: "DELETE", target: 0 });

		const socket = new WebSocket(WS_URL);

		socket.addEventListener("open", () => {
			setModalVisibility(false);

			socket.send('{"id":"a","auth":"a"}');
			socketCloseIntentional.current = false;
		});
		socket.addEventListener("close", () => {
			if (!socketCloseIntentional.current) {
				setModalType("SERVER_ERROR");
				setModalVisibility(true);
			}
		});
		socket.addEventListener("message", async (event) => {
			if (event.data) {
				if (event.data.text) {
					setModalVisibility(false);

					const dataText = await event.data.text();
					const dataJSON = JSON.parse(dataText);

					for (let i = 0; i < 4; i++) {
						// TO-DO remove this line once you fix touch3
						if (i === 2) {
							continue;
						}

						let newData = dataJSON[`touch${i + 1}`];

						if (dataBuffer[i][0] === -1) {
							dataBuffer[i].fill(newData);
							dataAverages[i] = newData;
						} else {
							const diffPercent = Math.abs(
								(newData - dataAverages[i]) /
									(dataAverages[i] != 0 ? dataAverages[i] : 1)
							);

							const touchedState = touched.current[i];

							if (diffPercent < TOUCH_THRESHOLD.mid ) {

								if (touchedState.touched) {
									touchedState.touched = false;
									touchedState.releaseTime = Date.now();
								}


								dataBuffer[i].shift();
								dataBuffer[i].push(newData);
								const count = dataBuffer[i].reduce(
									(total, val) => total + val,
									0
								);

								dataAverages[i] = count / 15;

								leafShadePercents[i] = 0;

							} else {
								if ( Date.now() < touchedState.releaseTime + RELEASE_DEBOUNCE ) {
									touchedState.touched = true;
								}
								
								if (!touchedState.touched) {
									touchedState.touched = true;
									setToasts({
										type: "PUSH",
										payload: {
											touchId: i + 1,
											percentDiff: diffPercent,
											key: `${i + 1}-${diffPercent.toFixed(
												6
											)}-${Math.random()}`,
										},
									});
									const id = toasts.length;
	
									setTimeout(() => {
										onToastClose(id);
									}, 5000);
								}

								leafShadePercents[i] = (diffPercent - TOUCH_THRESHOLD.low)/(TOUCH_THRESHOLD.high - TOUCH_THRESHOLD.low)*100;
							}

							
						}
					}

					setLeafStates({
						Leaf1: leafShadePercents[0],
						Leaf2: leafShadePercents[1],
						Leaf3: leafShadePercents[2],
						Leaf4: leafShadePercents[3],
					});

					setData([
						{ reading: dataJSON.touch1, avg: Math.round(dataAverages[0]) },
						{ reading: dataJSON.touch2, avg: Math.round(dataAverages[1]) },
						{ reading: dataJSON.touch3, avg: Math.round(dataAverages[2]) },
						{ reading: dataJSON.touch4, avg: Math.round(dataAverages[3]) },
					]);
				} else if (event.data === "no esp :(") {
					setModalType("ESP32_ERROR");
					setModalVisibility(true);
				}
			}
		});
	}, [reconnect]);

	useEffect(() => {
		setReconnect(reconnect + 1);
	}, []);

	return {
		data,
		leafStates,
		onReconnect,
		modalType,
		modalVisible,
		toasts,
		onToastClose,
	};
}
