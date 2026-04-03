import TrafficDashboard from "../components/TrafficDashboard";
import { Toaster } from "sonner";

const Index = () => {
  return (
    <>
      <Toaster position="top-right" richColors />
      <TrafficDashboard />
    </>
  );
};

export default Index;
