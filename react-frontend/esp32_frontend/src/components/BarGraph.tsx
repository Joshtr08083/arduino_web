import { ResponsiveBar, type BarDatum } from '@nivo/bar'

interface Props {
  data: BarDatum[];
}

const BarGraph = ( {data} : Props) => {
  return (
    <ResponsiveBar
        data={data}
        indexBy="touchId"
        labelSkipWidth={12}
        labelSkipHeight={12}
        valueScale={{type: 'linear'}}

        legends={[
        {
            dataFrom: 'keys',
            anchor: 'bottom-right',
            direction: 'column',
            translateX: 120,
            itemsSpacing: 3,
            itemWidth: 100,
            itemHeight: 16
        }
        ]}
        axisBottom={{ legend: 'Touch Sensor', legendOffset: 32 }}
        axisLeft={{ legend: 'Resistance (?)', legendOffset: -40 }}
        margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
    />

  )
}



export default BarGraph