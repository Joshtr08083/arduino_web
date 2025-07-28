import { type ReactNode } from "react";

interface Props {
    show: boolean
	title: string;
	children: ReactNode;
}

const AlertModal = ( { show, title, children} : Props) => {
	return (
		<div
			className={`modal fade ${show ? 'show d-block' : 'd-none'}`}
			id="staticBackdrop"
			data-bs-backdrop="static"
			data-bs-keyboard="false"
			tabIndex={-1}
			aria-labelledby="staticBackdropLabel"
			aria-hidden="true"
		>
			<div className="modal-dialog modal-dialog-centered ">
				<div className="modal-content bg-light text-dark">
					<div className="modal-header border-dark">
						<h1 className="modal-title fs-5" id="staticBackdropLabel">
							{title}
						</h1>
						{/* <button 
                            onClick={onClose}
							type="button"
							className="btn-close"
							aria-label="Close"
						></button> */}
					</div>
					<div className="modal-body">{children}</div>
					<div className="modal-footer border-dark">
						{/* <button
							onClick={onClose}
							type="button"
							className="btn btn-secondary"
							data-bs-dismiss="modal"
						>
							Close
						</button> */}
						<button type="button" className="btn btn-primary" onClick={() => {location.reload()}}>
							Reload
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AlertModal;
