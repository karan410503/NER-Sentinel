import React from 'react';
import KpiCards from '../../components/analytics/KpiCards';
import RouteRiskTimeline from '../../components/analytics/RouteRiskTimeline';
import DistrictAccessibilityChart from '../../components/analytics/DistrictAccessibilityChart';
import AIRiskFactorsRadar from '../../components/analytics/AIRiskFactorsRadar';
import DeliveryPerformanceChart from '../../components/analytics/DeliveryPerformanceChart';
import FleetStatusDonut from '../../components/analytics/FleetStatusDonut';
import IncidentActivityChart from '../../components/analytics/IncidentActivityChart';
import WeatherImpactScatter from '../../components/analytics/WeatherImpactScatter';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            LOGISTICS COMMAND CENTER
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
              AI ACTIVE
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1 tracking-wide">
            Real-time geospatial intelligence & predictive routing analytics
          </p>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <KpiCards />

      {/* Row 2: Route Risk Forecast */}
      <RouteRiskTimeline />

      {/* Row 3: District Accessibility & AI Risk Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistrictAccessibilityChart />
        <AIRiskFactorsRadar />
      </div>

      {/* Row 4: Delivery Performance & Fleet Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeliveryPerformanceChart />
        <FleetStatusDonut />
      </div>

      {/* Row 5: Incident Activity & Weather Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncidentActivityChart />
        <WeatherImpactScatter />
      </div>
    </div>
  );
}
