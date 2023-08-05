import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import data from '../public/benchmark-data.json'; // import JSON data

function SimpleBarChart() {
  return (
    <BarChart width={500} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="pv" fill="#8884d8" />
      <Bar dataKey="uv" fill="#82ca9d" />
    </BarChart>
  );
}

export default SimpleBarChart;
