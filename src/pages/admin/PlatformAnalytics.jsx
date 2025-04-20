import React, { useState, useEffect } from 'react';
import { FiDownload, FiFilter, FiCalendar, FiPieChart, FiBarChart2, FiTrendingUp, FiTrendingDown, FiAlertCircle } from 'react-icons/fi';
import { AnalyticsService } from '../../../../shared';

// Format currency function
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Generate simple chart function (this is a placeholder for actual chart rendering)
const generateBarChart = (data, valueKey = 'value') => {
  const maxValue = Math.max(...data.map(item => item[valueKey]));

  return (
    <div className="flex items-end h-40 space-x-2">
      {data.map((item, index) => {
        const height = item[valueKey] > 0 ? (item[valueKey] / maxValue) * 100 : 0;
        return (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="w-full bg-blue-500 rounded-t-sm transition-all duration-500"
              style={{ height: `${height}%` }}
            ></div>
            <div className="text-xs mt-1 text-gray-500 w-full text-center truncate">
              {item.month || item.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Generate pie chart function (placeholder)
const generatePieChart = (data) => {
  // In a real app, this would use a proper chart library
  return (
    <div className="space-y-2 mt-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full"
              style={{ width: `${item.value || item.percentage}%` }}
            ></div>
          </div>
          <div className="ml-3 flex justify-between items-center w-40">
            <span className="text-sm text-gray-700">{item.name || item.source || item.device || item.region}</span>
            <span className="text-sm font-medium text-gray-900">{item.value || item.percentage}%</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const PlatformAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('year');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    // Fetch real analytics data
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { success, data: analyticsData, error: analyticsError } = await AnalyticsService.getPlatformAnalytics({
          timeRange,
          startDate: dateRange.start,
          endDate: dateRange.end
        });
        
        if (success && analyticsData) {
          setData(analyticsData);
        } else {
          setError(analyticsError || 'Failed to fetch analytics data');
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, dateRange]);

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    
    // Update date range based on selected time range
    const now = new Date();
    let start;
    
    switch(range) {
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        start = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
    }
    
    setDateRange({
      start: start.toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10)
    });
  };

  // Handle date range change
  const handleDateRangeChange = (start, end) => {
    setDateRange({ start, end });
  };

  // Handle export click
  const handleExport = () => {
    if (!data) return;
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Category,Value,Change\n";
    
    // Add data rows
    csvContent += `Total Revenue,${data.totalRevenue.value},${data.totalRevenue.change}%\n`;
    csvContent += `Total Orders,${data.salesCount.value},${data.salesCount.change}%\n`;
    csvContent += `Active Users,${data.activeUsers.value},${data.activeUsers.change}%\n`;
    csvContent += `Avg. Order Value,${data.averageOrderValue.value},${data.averageOrderValue.change}%\n`;
    csvContent += `Conversion Rate,${data.conversionRate.value}%,${data.conversionRate.change}%\n`;
    
    // Encode and download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `platform-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="px-6 py-6 w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600">
            Performance metrics and insights for the entire platform
          </p>
        </div>
        <div className="flex space-x-4">
          <div className="relative">
            <div className="flex items-center bg-white rounded-lg border border-gray-300 px-3 py-2">
              <FiCalendar className="text-gray-400 mr-2" />
              <span className="text-sm">
                {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div>
            <div className="flex rounded-md shadow-sm">
              <button
                className={`px-4 py-2 text-sm border border-gray-300 rounded-l-md ${
                  timeRange === 'month' ? 'bg-blue-50 text-blue-600 border-blue-500' : 'bg-white text-gray-700'
                }`}
                onClick={() => handleTimeRangeChange('month')}
              >
                Month
              </button>
              <button
                className={`px-4 py-2 text-sm border-t border-b border-gray-300 ${
                  timeRange === 'quarter' ? 'bg-blue-50 text-blue-600 border-blue-500' : 'bg-white text-gray-700'
                }`}
                onClick={() => handleTimeRangeChange('quarter')}
              >
                Quarter
              </button>
              <button
                className={`px-4 py-2 text-sm border border-gray-300 rounded-r-md ${
                  timeRange === 'year' ? 'bg-blue-50 text-blue-600 border-blue-500' : 'bg-white text-gray-700'
                }`}
                onClick={() => handleTimeRangeChange('year')}
              >
                Year
              </button>
            </div>
          </div>
          <button
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            onClick={handleExport}
          >
            <FiDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FiAlertCircle className="text-red-500 text-4xl mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to load analytics data</h3>
          <p className="text-gray-600 max-w-md">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => {
              setLoading(true);
              window.location.reload();
            }}
          >
            Try Again
          </button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                  <h3 className="text-lg font-bold mt-1">{formatCurrency(data.totalRevenue.value)}</h3>
                </div>
                <div className={`flex items-center px-2 py-2 rounded-full w-30 h-30 text-xs font-medium ${
                  data.totalRevenue.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {data.totalRevenue.isPositive ? (
                    <FiTrendingUp className="mr-1" />
                  ) : (
                    <FiTrendingDown className="mr-1" />
                  )}
                  {data.totalRevenue.change}%
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                  <h3 className="text-2xl font-bold mt-1">{data.salesCount.value.toLocaleString()}</h3>
                </div>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  data.salesCount.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {data.salesCount.isPositive ? (
                    <FiTrendingUp className="mr-1" />
                  ) : (
                    <FiTrendingDown className="mr-1" />
                  )}
                  {data.salesCount.change}%
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Active Users</p>
                  <h3 className="text-2xl font-bold mt-1">{data.activeUsers.value.toLocaleString()}</h3>
                </div>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  data.activeUsers.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {data.activeUsers.isPositive ? (
                    <FiTrendingUp className="mr-1" />
                  ) : (
                    <FiTrendingDown className="mr-1" />
                  )}
                  {data.activeUsers.change}%
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Avg. Order Value</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(data.averageOrderValue.value)}</h3>
                </div>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  data.averageOrderValue.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {data.averageOrderValue.isPositive ? (
                    <FiTrendingUp className="mr-1" />
                  ) : (
                    <FiTrendingDown className="mr-1" />
                  )}
                  {data.averageOrderValue.change}%
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Conversion Rate</p>
                  <h3 className="text-2xl font-bold mt-1">{data.conversionRate.value}%</h3>
                </div>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  data.conversionRate.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {data.conversionRate.isPositive ? (
                    <FiTrendingUp className="mr-1" />
                  ) : (
                    <FiTrendingDown className="mr-1" />
                  )}
                  {data.conversionRate.change}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Revenue chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Revenue Trend</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <FiBarChart2 className="mr-2" />
                  Monthly Revenue
                </div>
              </div>
              {generateBarChart(data.monthlyRevenue)}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Category Distribution</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <FiPieChart className="mr-2" />
                  Sales by Category
                </div>
              </div>
              {generatePieChart(data.categories)}
            </div>
          </div>
          
          {/* Top products and traffic sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Top Selling Products</h3>
                <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="pb-3">Product</th>
                      <th className="pb-3">Units Sold</th>
                      <th className="pb-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.topProducts.map((product, index) => (
                      <tr key={index}>
                        <td className="py-3 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="py-3 text-sm text-gray-500">{product.sales}</td>
                        <td className="py-3 text-sm text-gray-500">{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Traffic Sources</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-2">Total: {data.activeUsers.value.toLocaleString()} users</span>
                </div>
              </div>
              {generatePieChart(data.trafficSources)}
            </div>
          </div>
          
          {/* Device and geographic distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Device Distribution</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <FiFilter className="mr-2" />
                  By Device Type
                </div>
              </div>
              <div className="flex justify-around p-4">
                {data.userDevices.map((device, index) => (
                  <div key={index} className="text-center">
                    <div className="relative inline-block mx-auto">
                      <svg className="w-20 h-20">
                        <circle 
                          cx="40" 
                          cy="40" 
                          r="36" 
                          fill="none" 
                          stroke="#E5E7EB" 
                          strokeWidth="8"
                        />
                        <circle 
                          cx="40" 
                          cy="40" 
                          r="36" 
                          fill="none" 
                          stroke="#3B82F6" 
                          strokeWidth="8"
                          strokeDasharray={`${device.percentage * 2.26} 226`}
                          strokeDashoffset="0" 
                          transform="rotate(-90 40 40)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold">{device.percentage}%</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-800">{device.device}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Geographic Distribution</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <FiFilter className="mr-2" />
                  By Region
                </div>
              </div>
              {generatePieChart(data.geographicData)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PlatformAnalytics; 