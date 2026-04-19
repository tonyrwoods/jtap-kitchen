import { AlertTriangle, TrendingUp, DollarSign, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function OverchargeAlertCard({ alert, onDismiss, onViewInvoice }) {
  const severityColors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-orange-100 text-orange-800 border-orange-200",
    low: "bg-yellow-100 text-yellow-800 border-yellow-200"
  };

  const severityIcons = {
    high: AlertTriangle,
    medium: TrendingUp,
    low: DollarSign
  };

  const Icon = severityIcons[alert.severity] || AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`border-l-4 rounded-r-lg p-4 mb-4 ${severityColors[alert.severity]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Icon className="w-6 h-6 mt-0.5" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">
                {alert.item_name} - {alert.vendor_name}
              </h4>
              <Badge variant="outline" className="text-xs">
                {alert.category}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
              <div>
                <p className="text-xs opacity-70">Invoice Price</p>
                <p className="font-semibold">${alert.invoice_price?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Historical Avg</p>
                <p className="font-semibold">${alert.historical_avg?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Variance</p>
                <p className="font-semibold text-red-600">+{alert.variance_percent?.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Overcharge Est.</p>
                <p className="font-semibold text-red-600">${alert.overcharge_amount?.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs opacity-80">
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>Invoice: {alert.invoice_id}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{alert.purchase_date}</span>
              </div>
            </div>

            {alert.reason && (
              <p className="mt-2 text-sm italic opacity-90">
                {alert.reason}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewInvoice?.(alert.invoice_id)}
            className="text-xs"
          >
            View Invoice
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDismiss?.(alert.id)}
            className="text-xs"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </motion.div>
  );
}