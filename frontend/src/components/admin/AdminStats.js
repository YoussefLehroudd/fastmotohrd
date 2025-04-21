import React from 'react';
import { Box, Card, CardContent, Grid, Typography, Divider } from '@mui/material';
import { 
  People as PeopleIcon,
  TwoWheeler as MotorIcon,
  BookOnline as BookingIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from "react-simple-maps";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card sx={{ height: '100%', backgroundColor: color, color: 'white' }}>
    <CardContent>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Icon sx={{ fontSize: 40 }} />
        </Grid>
        <Grid item>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <Typography variant="h4">
            {value}
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const DetailCard = ({ title, details }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom color="primary">
        {title}
      </Typography>
      <Divider sx={{ my: 1 }} />
      {details.map((detail, index) => (
        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
          {React.isValidElement(detail.label) ? (
            detail.label
          ) : (
            <Typography variant="body1" color="textSecondary">
              {detail.label}
            </Typography>
          )}
          <Typography variant="body1" fontWeight="bold">
            {detail.value}
          </Typography>
        </Box>
      ))}
    </CardContent>
  </Card>
);

const BrowserItem = ({ index, browser, sessions }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 1 }}>
      <Typography sx={{ minWidth: 24 }}>{index}.</Typography>
      <Typography sx={{ flex: 1 }}>{browser}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontWeight: 'bold' }}>{sessions} (sessions)</Typography>
      </Box>
    </Box>
  );
};

const AdminStats = ({ stats }) => {
  if (!stats) return null;

  const {
    users = {},
    motors = {},
    bookings = {},
    payments = {},
    topBrowsers = [],
    topPages = []
  } = stats;

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Main Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={users.total || 0}
            icon={PeopleIcon}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Motors"
            value={motors.available || 0}
            icon={MotorIcon}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bookings"
            value={bookings.total || 0}
            icon={BookingIcon}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`${(Number(payments.totalAmount) || 0).toLocaleString()} MAD`}
            icon={PaymentIcon}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Detailed Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <DetailCard
            title="User Statistics"
            details={[
              { label: 'Regular Users', value: users.regularUsers || 0 },
              { label: 'Sellers', value: users.sellers || 0 },
              { label: 'Admins', value: users.admins || 0 },
              { label: 'New Users (Today)', value: users.newToday || 0 },
              { label: 'Active Users', value: users.active || 0 }
            ]}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DetailCard
            title="Motor Statistics"
            details={[
              { label: 'Total Motors', value: motors.total || 0 },
              { label: 'Available', value: motors.available || 0 },
              { label: 'Currently Rented', value: motors.rented || 0 },
              { label: 'Average Daily Rate', value: `${(Number(motors.avgDailyRate) || 0).toFixed(2)} MAD` }
            ]}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DetailCard
            title="Booking Statistics"
            details={[
              { label: 'Pending Bookings', value: bookings.pending || 0 },
              { label: 'Active Bookings', value: bookings.active || 0 },
              { label: 'Completed Today', value: bookings.completedToday || 0 },
              { label: 'Total Revenue Today', value: `${(Number(payments.todayAmount) || 0).toLocaleString()} MAD` },
              { label: 'Avg. Booking Value', value: `${(Number(payments.avgBookingValue) || 0).toFixed(2)} MAD` }
            ]}
          />
        </Grid>
      </Grid>

      {/* New Stats: Top Browsers and Top Most Visit Pages */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Top Browsers
              </Typography>
              <Divider sx={{ my: 1 }} />
              {topBrowsers.map((browser, index) => (
                <BrowserItem 
                  key={index}
                  index={index + 1}
                  browser={browser.browser}
                  sessions={browser.sessions}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <DetailCard
            title="Top Most Visit Pages"
            details={topPages.map((page) => ({
              label: page.url,
              value: `${page.views} (views)`
            }))}
          />
        </Grid>
      </Grid>

      {/* Visitor Countries */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
                Visitor Countries Map
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ width: '100%', height: '350px', backgroundColor: '#141414', position: 'relative', overflow: 'hidden' }}>
                <ComposableMap
                  projection="geoMercator"
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <ZoomableGroup center={[-5, 30]} zoom={3.2}>
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const isVisited = stats.visitorCountries?.find(
                            c => c.country_name === geo.properties.name
                          );
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={isVisited ? "#0088ff" : "#1f1f1f"}
                              stroke="#333"
                              strokeWidth={0.5}
                              style={{
                                default: {
                                  outline: "none",
                                  cursor: isVisited ? "pointer" : "default"
                                },
                                hover: {
                                  fill: isVisited ? "#2196f3" : "#3f3f3f",
                                  outline: "none"
                                }
                              }}
                              onMouseEnter={(e) => {
                                if (isVisited) {
                                  const tooltip = document.createElement('div');
                                  tooltip.id = 'country-tooltip';
                                  tooltip.style.position = 'fixed';
                                  tooltip.style.backgroundColor = '#0088ff';
                                  tooltip.style.color = 'white';
                                  tooltip.style.padding = '6px 12px';
                                  tooltip.style.borderRadius = '4px';
                                  tooltip.style.fontSize = '14px';
                                  tooltip.style.fontWeight = '500';
                                  tooltip.style.zIndex = '9999';
                                  tooltip.style.pointerEvents = 'none';
                                  tooltip.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                                  tooltip.style.whiteSpace = 'nowrap';
                                  const percentage = stats.visitorCountries.find(c => c.country_name === geo.properties.name)?.percentage;
                                  tooltip.innerHTML = `${geo.properties.name}: ${percentage}%`;
                                  document.body.appendChild(tooltip);
                                  
                                  function updatePosition(e) {
                                    tooltip.style.left = (e.clientX + 10) + 'px';
                                    tooltip.style.top = (e.clientY - 10) + 'px';
                                  }
                                  updatePosition(e);
                                  document.addEventListener('mousemove', updatePosition);
                                  tooltip.updatePosition = updatePosition;
                                }
                              }}
                              onMouseLeave={() => {
                                const tooltip = document.getElementById('country-tooltip');
                                if (tooltip && tooltip.updatePosition) {
                                  document.removeEventListener('mousemove', tooltip.updatePosition);
                                  document.body.removeChild(tooltip);
                                }
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ZoomableGroup>
                </ComposableMap>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, color: '#666' }}>
                  Top regions
                </Typography>
                {stats.visitorCountries?.map((country, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      py: 1,
                      '&:not(:last-child)': {
                        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    <Typography variant="body1" sx={{ color: '#333' }}>
                      {country.country_name}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#0088ff' }}>
                      {country.percentage}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminStats;
