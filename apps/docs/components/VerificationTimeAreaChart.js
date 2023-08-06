import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Label } from 'recharts';
import data from '../public/benchmarks/proof-verifying.json'; // import JSON data

// Custom Tooltip component
const CustomTooltip = ({ active, payload, label }) => {
    if (active) {
      return (
        <div style={{ backgroundColor: 'rgba(255,255,255,0)', border: 'none', boxShadow: 'none' }}>
          <p>{`Date: ${label}`}</p>
          <p>{`Duration: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
};

function VerificationTimeAreaChart() {
    return (
      <AreaChart width={750} height={400} data={data} margin={{ top: 20, right: 40, left: 100, bottom: 50 }}>
        <defs>
          <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fcba03" stopOpacity={0.8}/>
            <stop offset="55%" stopColor="#fcba03" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="name" axisLine={false} height={50}>
          <Label value="Date" position="insideBottomLeft" offset={-5} />
        </XAxis>
        <YAxis axisLine={false} width={80}>
          <Label value="Verification Time" angle={-90} position="center" offset={20} />
        </YAxis>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area type="monotone" dataKey="duration" stroke="#fcba03" fillOpacity={1} fill="url(#colorDuration)" />
      </AreaChart>
    );
}

export default VerificationTimeAreaChart;
