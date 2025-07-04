import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const Privacy = () => (
  <Container maxWidth="md" sx={{ mt: 8, mb: 8, flex: 1 }}>
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h3" gutterBottom>
        Privacy Policy
      </Typography>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          1. Information We Collect
        </Typography>
        <Typography paragraph>
          We collect information you provide when you register, use the app, or contact us. This may include your email address, profile information, and usage data.
        </Typography>
        <Typography variant="h6" gutterBottom>
          2. How We Use Information
        </Typography>
        <Typography paragraph>
          We use your information to provide, maintain, and improve the service, communicate with you, and ensure security and compliance.
        </Typography>
        <Typography variant="h6" gutterBottom>
          3. Sharing of Information
        </Typography>
        <Typography paragraph>
          We do not sell your personal information. We may share data with service providers or as required by law.
        </Typography>
        <Typography variant="h6" gutterBottom>
          4. Data Security
        </Typography>
        <Typography paragraph>
          We implement reasonable security measures to protect your data. However, no method of transmission or storage is 100% secure.
        </Typography>
        <Typography variant="h6" gutterBottom>
          5. Changes to This Policy
        </Typography>
        <Typography paragraph>
          We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.
        </Typography>
        <Typography variant="h6" gutterBottom>
          6. Contact
        </Typography>
        <Typography paragraph>
          If you have any questions about this Privacy Policy, please contact us at support@example.com.
        </Typography>
      </Box>
    </Paper>
  </Container>
);

export default Privacy; 
