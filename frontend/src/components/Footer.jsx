import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import GitHubIcon from '@mui/icons-material/GitHub';

const footerLinkSx = { display: 'flex', alignItems: 'center', fontSize: '0.875rem', p: 0, lineHeight: 1, height: '40px' };

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        pt: 2,
        pb: 0,
        px: 2,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg" sx={{ pb: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            minHeight: 40,
            height: '40px',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', lineHeight: 1, height: '40px' }}>
            © {new Date().getFullYear()} LoL Decay Tracker. All rights reserved.
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flexWrap: 'wrap',
              justifyContent: 'center',
              height: '40px',
            }}
          >
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="hover"
              sx={footerLinkSx}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="hover"
              sx={footerLinkSx}
            >
              Terms of Service
            </Link>
            <Link
              href="/about"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="hover"
              sx={footerLinkSx}
            >
              About Us
            </Link>
            <Link
              href="https://github.com/dain98/League-Decay-Tracker"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="none"
              aria-label="GitHub"
              sx={footerLinkSx}
            >
              <GitHubIcon fontSize="medium" sx={{ verticalAlign: 'middle' }} />
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 
