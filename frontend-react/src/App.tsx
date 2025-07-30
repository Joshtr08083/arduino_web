import "bootstrap/dist/css/bootstrap.css";
import "./App.css";

// plant
import Plant from "./components/Plant";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import DataList from "./components/DataList";
import AlertModal from "./components/AlertModal";
import Toasts from "./components/Toasts";
import { websocketController } from "./api/WebSockets";

function App() {
	const {
		data,
		leafStates,
		onReconnect,
		modalType,
		modalVisible,
		toasts,
		onToastClose,
	} = websocketController();

	return (
		<>
			<div className="App bg-dark text-white">
				<h2 className="text-white border-secondary text-center border-bottom w-50 m-auto p-3">
					PLANT VIEWER
				</h2>

				<DataList data={data} />
				<Toasts toasts={toasts} onClose={onToastClose} />

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

				<AlertModal
					type={modalType}
					show={modalVisible}
					onReconnect={onReconnect}
				/>
			</div>
		</>
	);
}

export default App;
