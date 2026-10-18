import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function useRevenueReport(range) {
  const queryClient = useQueryClient();
  useEffect(() => {
    let timer;
    const invalidate = () => {
      clearTimeout(timer);
      timer = setTimeout(() => queryClient.invalidateQueries({ queryKey: ["revenue-report"] }), 500);
    };
    const unsubscribeInvoice = base44.entities.Invoice.subscribe(invalidate);
    const unsubscribeOrder = base44.entities.Order.subscribe(invalidate);
    return () => { clearTimeout(timer); unsubscribeInvoice(); unsubscribeOrder(); };
  }, [queryClient]);
  return useQuery({
    queryKey: ["revenue-report", range],
    queryFn: async () => {
      const { data } = await base44.functions.invoke("getRevenueAnalytics", { range });
      return data;
    },
    staleTime: 60000,
    retry: false,
    refetchOnWindowFocus: true,
  });
}