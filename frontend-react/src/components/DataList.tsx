interface SensorReading {
	reading: number;
	avg: number;
}

interface Props {
	data: SensorReading[];
}

const DataList = ({ data }: Props) => {
	return (
		<div className="m-4 bg-dark text-white w-25 mt-5">
			<h2 className="text-center">Sensor Readings</h2>
			<ul className="list-group">
        
				{data.map((sensor, id) => (
					<li key={id} className="list-group-item bg-dark text-white p-3 d-flex flex-column row-gap-2">
						<span className="border-bottom border-secondary w-75 text-center m-auto">
							Touch {id + 1}:
						</span>
						<span className="d-flex justify-content-between ps-4 pe-4">
							<span>Reading: </span>
							<span>{sensor.reading}</span>
						</span>
						<span className="d-flex justify-content-between ps-4 pe-4">
							<span>Avg: </span>
							<span>{sensor.avg}</span>
						</span>
					</li>
				))}
			</ul>
		</div>
	);
};

export default DataList;
