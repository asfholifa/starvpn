import React, { useMemo, useRef } from 'react';
import { Line } from 'react-chartjs-2';

const chartOptions = {
  scales: {
    xAxes: [
      {
        type: 'time',
        ticks: {
          display: false,
        },
      },
    ],
    yAxes: [
      {
        ticks: {
          beginAtZero: true,
        },
      },
    ],
  },
  legend: {
    display: false,
  },
};

export default function StatsChart({ data, labels, style }) {
  const chartReference = useRef();
  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          // label: 'Bytes',
          data,
          lineTension: 0,
          backgroundColor: '#6473CB',
          pointRadius: 0,
        },
      ],
    }),
    [data, labels],
  );
  return (
    <Line
      style={style}
      ref={chartReference}
      data={chartData}
      options={chartOptions}
      width={200}
      height={75}
    />
  );
}
