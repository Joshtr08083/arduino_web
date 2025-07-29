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
	const showModal = useRef(false);
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
	let diffPercents = [0, 0, 0, 0];


	const WS_URL = "ws://127.0.0.1:8080";
	const socketClose = useRef(false);
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
			if (showModal.current && modalType === "SERVER_ERROR")
				showModal.current = false;

			socket.send('{"id":"a","auth":"a"}');
			socketClose.current = false;
		});
		socket.addEventListener("close", () => {
			if (
				!socketClose.current &&
				(!showModal.current || modalType === "ESP32_ERROR")
			) {
				setModalType("SERVER_ERROR");
				showModal.current = true;
			}
		});
		socket.addEventListener("message", async (event) => {
			if (event.data) {
				if (event.data.text) {
					if (showModal.current) showModal.current = false;

					const dataText = await event.data.text();
					const dataJSON = JSON.parse(dataText);

					for (let i = 0; i < 4; i++) {
						let newData = dataJSON[`touch${i + 1}`];

						if (dataBuffer[i][0] === -1) {
							dataBuffer[i].fill(newData);
							dataAverages[i] = newData;
						} else {
							const diffPercent = Math.abs(
								(newData - dataAverages[i]) /
									(dataAverages[i] != 0 ? dataAverages[i] : 1)
							);
							diffPercents[i] = diffPercent;

							if (diffPercent < 0.03) {
								dataBuffer[i].shift();
								dataBuffer[i].push(newData);
								const count = dataBuffer[i].reduce(
									(total, val) => total + val,
									0
								);

								dataAverages[i] = count / 15;
							} else {
								// setToasts({
								// 	type: "PUSH",
								// 	payload: {
								// 		touchId: i + 1,
								// 		percentDiff: diffPercent,
								// 		key: `${i + 1}-${diffPercent.toFixed(6)}-${Math.random()}`,
								// 	},
								// });
								// const id = toasts.length;

								// setTimeout(() => {
								// 	onToastClose(id);
								// }, 5000);
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
					if (!showModal.current) {
						setModalType("ESP32_ERROR");
						showModal.current = true;
					}
				}
			}
		});

		return () => {
			if (socket.readyState) {
				socketClose.current = true;
				socket.close();
			}
		};
	}, [reconnect]);

	useEffect(() => {
		setReconnect(reconnect + 1);
	}, []);

	return {
		data,
		leafStates,
		onReconnect,
		modalType,
		showModal,
		toasts,
		onToastClose,
	};
}
