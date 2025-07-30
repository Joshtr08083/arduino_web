
interface toastData {
    percentDiff: number
    touchId: number
    key: string
}

interface Props {
    toasts: toastData[]
    onClose: (id: number) => void
}

const Toasts = ( { toasts, onClose } : Props ) => {
	return (
		<div className="toast-container position-fixed bottom-0 end-0 p-3">
            {toasts.map((toast, id) => (
                <div
                    className="toast show bg-dark"
                    role="alert"
                    aria-live="assertive"
                    aria-atomic="true"
                    key={id}
                >   

                    <div className="toast-header bg-secondary text-light">
                        {/* <img src="..." className="rounded me-2" alt="..."> */}
                        <strong className="me-auto"> Possible Touch </strong>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => {onClose(id)}}
                            aria-label="Close"
                        ></button>
                    </div>
                    <div className="toast-body">Sensor {toast.touchId} | Diff: {Math.round(toast.percentDiff*100)/100}% </div>
                </div>
            ))}


		</div>
	);
};

export default Toasts;
