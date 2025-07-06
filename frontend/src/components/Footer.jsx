import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import GitHubIcon from '@mui/icons-material/GitHub';

const footerLinkSx = { display: 'flex', alignItems: 'center', fontSize: '0.875rem', p: 0 };

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        minHeight: 40,
        pt: 2,
        pb: 2,
        px: 2,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg" sx={{ pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} LoL Decay Tracker. All rights reserved.
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flexWrap: 'wrap',
              justifyContent: 'center'
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
              <GitHubIcon fontSize="medium" />
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 
