import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const Header: React.FC = () => {
  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          🤖 AI Researcher Tool - POC
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Standard Installation Version
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 