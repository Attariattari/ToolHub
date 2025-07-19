import { useEffect, useState } from "react";

const useLeaflet = () => {
  const [leaflet, setLeaflet] = useState(null);

  useEffect(() => {
    (async () => {
      if (typeof window !== "undefined") {
        const L = await import("leaflet");
        setLeaflet(L);
      }
    })();
  }, []);

  return leaflet;
};

export default useLeaflet;