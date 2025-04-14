import React from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  FormGroup,
  List,
  ListItem,
  Divider,
  Paper
} from '@mui/material';

const FilterSidebar = ({ onFilterChange, selectedCategories = [], availabilityFilter = {}, priceRange = {} }) => {
  const brands = [
    { name: 'Yamaha', count: 1 },
    { name: 'Honda', count: 1 },
    { name: 'Suzuki', count: 1 },
    { name: 'KTM', count: 1 }
  ];

  const handleBrandChange = (brand) => {
    const newBrands = selectedCategories.includes(brand)
      ? selectedCategories.filter(b => b !== brand)
      : [...selectedCategories, brand];
    onFilterChange({ categories: newBrands });
  };

  const handleAvailabilityChange = (type) => {
    const newAvailability = {
      ...availabilityFilter,
      [type]: !availabilityFilter[type]
    };
    onFilterChange({ availability: newAvailability });
  };

  const handlePriceChange = (type, value) => {
    const newPriceRange = {
      ...priceRange,
      [type]: value
    };
    onFilterChange({ price: newPriceRange });
  };

  return (
    <Paper sx={{ p: 2, borderRadius: 1 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Marques
      </Typography>
      <List>
        {brands.map((brand) => (
          <ListItem key={brand.name} dense sx={{ pl: 0 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={selectedCategories.includes(brand.name)}
                  onChange={() => handleBrandChange(brand.name)}
                />
              }
              label={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Typography>{brand.name}</Typography>
                  <Typography color="text.secondary">{brand.count}</Typography>
                </Box>
              }
              sx={{ width: '100%' }}
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" sx={{ mb: 2 }}>
        Prix (MAD)
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          placeholder="À partir de"
          size="small"
          fullWidth
          value={priceRange.min}
          onChange={(e) => handlePriceChange('min', e.target.value)}
        />
        <Typography sx={{ mx: 1 }}>-</Typography>
        <TextField
          placeholder="Pour"
          size="small"
          fullWidth
          value={priceRange.max}
          onChange={(e) => handlePriceChange('max', e.target.value)}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" sx={{ mb: 2 }}>
        Disponibilité
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox 
              checked={availabilityFilter.availableNow}
              onChange={() => handleAvailabilityChange('availableNow')}
            />
          }
          label={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography>Disponible maintenant</Typography>
            </Box>
          }
        />
        <FormControlLabel
          control={
            <Checkbox 
              checked={availabilityFilter.availableLater}
              onChange={() => handleAvailabilityChange('availableLater')}
            />
          }
          label={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography>Disponible plus tard</Typography>
            </Box>
          }
        />
      </FormGroup>
    </Paper>
  );
};

export default FilterSidebar;
