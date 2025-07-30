type ModalType = "SERVER_ERROR" | "ESP32_ERROR";

interface Props {
	show: boolean;
	type: string;
	onReconnect: () => void;
}

function getContent(type: ModalType) {
	switch (type) {
		case "SERVER_ERROR":
			return {
				title: "Server Disconnected",
				content:
					"Lost connection to server (or never connected). Confirm server is running and click below to attempt to reconnect.",
				button: "RECONNECT",
			};
		case "ESP32_ERROR":
			return {
				title: "ESP32 Not Responding",
				content:
					"No response from ESP32. Wait for connection or if you think this is an error try reloading.",
				button: "RELOAD",
			};
		default:
			return {};
	}
}

const AlertModal = ({ show, type, onReconnect }: Props) => {
	const content = getContent(type as ModalType);

	return (
		<div
			className={`modal fade ${show ? "show d-block" : "d-none"}`}
			id="staticBackdrop"
			data-bs-backdrop="static"
			data-bs-keyboard="false"
			tabIndex={-1}
			aria-labelledby="staticBackdropLabel"
			aria-hidden="true"
			style={{ backdropFilter: "blur(10px)" }}
		>
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content text-dark">
					<div className="modal-header border-dark bg-dark text-light">
						<h1 className="modal-title fs-5" id="staticBackdropLabel">
							{content.title}
						</h1>
					</div>
					<div
						className={`modal-body bg-secondary ${
							!content.button && "rounded-bottom pt-4 pb-5"
						}`}
					>
						{content.content}
					</div>
					<div className="modal-footer border-dark bg-secondary p-1 pe-2">
						{content.button === "RECONNECT" ? (
							<button
								type="button"
								className="btn btn-primary"
								onClick={onReconnect}
							>
								Reconnect
							</button>
						) : (
							content.button === "RELOAD" && (
								<button
									type="button"
									className="btn btn-primary"
									onClick={() => {
										location.reload();
									}}
								>
									Reload
								</button>
							)
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default AlertModal;
